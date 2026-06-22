// pages/api/auth/signin.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import { serialize } from "cookie";
import bcrypt from "bcrypt";
import { jwtToken } from "../../../app/services/util/jwt";
import { plantCodeForCustomer } from "../../../app/services/util/plant-code";

/*
 * 01. 구분     : API
 * 02. 타입     : POST
 * 03. 업무구분  : 인증 - 로그인 처리
 * 03. 설명     : TB_CUSTOMER 기준으로 사용자 인증 후 JWT 발급 및 로그인 정보 반환
 * 04. 작성일자  : 2025.11.18
 * 05. 작성자   : 이우창
 */

type SignInRequestBody = {
  id?: string;
  pw?: string; // 클라이언트에서 base64 인코딩되어 전달
};

/**
 * 인증 응답 데이터 타입
 * - 프론트(userInfoAtom)에서 바로 저장 가능한 key로 맞춤
 */
type SignInSafeUser = {
  user_id: string;
  customer_id: string; // 추가  
  name: string;
  email: string;
  contact: string;
  role: string;
  status: string;
};

/**
 * Prisma 싱글톤
 * - 개발환경 HMR 시 PrismaClient 중복 생성 방지
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/**
 * 권한 문자열 정규화
 * - CUSTOMER_AUTH 원본값이 ADMIN / admin / 관리자 등 다양할 수 있으므로 일관 변환
 */
const normalizeRole = (auth: string): string => {
  const value = auth.trim().toLowerCase();
  if (value.includes("admin") || value.includes("관리")) return "admin";
  // 비관리자는 'member' — RAG 챗봇 연동 규약(FRONTEND_INTEGRATION.md): role "admin"|"member".
  return "member";
};

/**
 * base64 문자열 복원
 * - 기존/신규 DB 저장 정책이 다를 수 있어 (base64 그대로 저장 vs 평문 저장)
 *   비교 호환을 위해 복원값도 함께 비교
 */
const decodeBase64Safely = (encoded: string): string | null => {
  try {
    return Buffer.from(encoded, "base64").toString("utf-8");
  } catch {
    return null;
  }
};

/**
 * 로그인 요청 처리
 * - id => TB_CUSTOMER.CUSTOMER_USER_ID
 * - pw => TB_CUSTOMER.CUSTOMER_PASSWORD 비교
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // ── 메서드 가드: POST만 허용 ─────────────────────────────────────
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({
      success: false,
      message: `Method ${req.method} Not Allowed`,
    });
  }

  try {
    // ── 요청 바디 파싱 ──────────────────────────────────────────────
    const { id, pw } = req.body as SignInRequestBody;

    // ── 필수값 검증 ────────────────────────────────────────────────
    if (!id || !pw) {
      return res.status(400).json({
        success: false,
        message: "아이디와 비밀번호는 필수입니다.",
      });
    }

    // ── 사용자 조회(TB_CUSTOMER) ───────────────────────────────────
    // CUSTOMER_USER_ID는 schema 상 unique가 아니라 findFirst 사용
    const customer = await prisma.tB_CUSTOMER.findFirst({
      where: {
        CUSTOMER_USER_ID: id.trim(),
      },
      select: {
        CUSTOMER_ID: true,
        CUSTOMER_USER_ID: true,
        CUSTOMER_PASSWORD: true,
        CUSTOMER_NAME: true,
        CUSTOMER_EMAIL: true,
        CUSTOMER_PHONE: true,
        CUSTOMER_AUTH: true,
      },
    });

    if (!customer) {
      return res.status(401).json({
        success: false,
        message: "아이디 또는 비밀번호가 잘못되었습니다.",
      });
    }

    // ── 비밀번호 검증 ─────────────────────────────────────────────
    // 클라이언트(signin-client.tsx)는 pw를 base64(평문)으로 보낸다.
    // 1) bcrypt 해시 저장(신규 정책): 디코딩한 평문으로 bcrypt.compare
    // 2) 레거시(base64/평문 저장): 기존 방식으로 비교하고,
    //    "정상 base64 입력"임이 확인될 때만 bcrypt 해시로 재저장(점진 마이그레이션)
    const decodedPw = decodeBase64Safely(pw);
    const storedPassword = customer.CUSTOMER_PASSWORD ?? "";

    // bcrypt 해시 형식인지 정확히 판별($2a/$2b/$2y$cost$ + 60자).
    // 단순 startsWith("$2")는 평문이 "$2..."로 시작하는 엣지에서 오판하므로 사용하지 않는다.
    const looksLikeBcrypt =
      storedPassword.length === 60 && /^\$2[aby]\$\d{2}\$/.test(storedPassword);

    let isMatched = false;
    if (looksLikeBcrypt) {
      isMatched = decodedPw !== null && (await bcrypt.compare(decodedPw, storedPassword));
    } else {
      isMatched =
        storedPassword === pw ||
        (decodedPw !== null && storedPassword === decodedPw);

      // 브라우저가 보낸 정상 base64(평문)일 때만 마이그레이션한다.
      // 이렇게 하면 평문 pw를 보내는 비정상 클라이언트로 인해
      // 잘못된 해시가 저장되어 계정이 영구 잠기는 것을 방지한다.
      const isCanonicalBase64 =
        decodedPw !== null &&
        Buffer.from(decodedPw, "utf-8").toString("base64") === pw;

      if (isMatched && isCanonicalBase64) {
        try {
          await prisma.tB_CUSTOMER.update({
            where: { CUSTOMER_ID: customer.CUSTOMER_ID },
            data: { CUSTOMER_PASSWORD: await bcrypt.hash(decodedPw, 10) },
          });
        } catch (migrationError) {
          // 마이그레이션 실패는 로그인 자체를 막지 않음
          console.error("legacy password bcrypt migration failed:", migrationError);
        }
      }
    }

    if (!isMatched) {
      return res.status(401).json({
        success: false,
        message: "아이디 또는 비밀번호가 잘못되었습니다.",
      });
    }

    // ── 사용자 정보 매핑 ───────────────────────────────────────────
    const role = normalizeRole(customer.CUSTOMER_AUTH ?? "");
    const safeUserId = String(customer.CUSTOMER_USER_ID ?? id).trim();

    const safeUser: SignInSafeUser = {
      user_id: safeUserId,
      customer_id: customer.CUSTOMER_ID,
      name: customer.CUSTOMER_NAME ?? "",
      email: customer.CUSTOMER_EMAIL ?? "",
      contact: customer.CUSTOMER_PHONE ?? "",
      role,
      status: "활성",
    };

    // RAG 챗봇 권한 스코프용 plant_code(fems_cloud PLANT_CD) — customer_id에서 역산.
    // member는 이 값으로 본인 사업장만 조회됨. admin/미매핑(예: admin 계정)은 null.
    const plant_code = plantCodeForCustomer(String(customer.CUSTOMER_ID ?? ""));

    // ── JWT 페이로드 구성 및 발급 ──────────────────────────────────
    const tokenPayload = {
      customer_id: customer.CUSTOMER_ID,
      user_id: safeUser.user_id,
      name: safeUser.name,
      email: safeUser.email,
      contact: safeUser.contact,
      role: safeUser.role,
      plant_code, // RAG 챗봇 연동(FRONTEND_INTEGRATION.md): member 권한 스코프 키
      status: safeUser.status,
      auth: customer.CUSTOMER_AUTH,
    };

    const token = await jwtToken(tokenPayload);

    // ── HTTPS 여부 판단(프록시 환경 고려) ───────────────────────────
    const forwardedProto = String(
      req.headers["x-forwarded-proto"] || req.headers["X-Forwarded-Proto"] || ""
    ).toLowerCase();
    const isHttps = forwardedProto.includes("https");

    // ── JWT 쿠키 저장(httpOnly) ────────────────────────────────────
    res.setHeader(
      "Set-Cookie",
      serialize("session-Info", token, {
        httpOnly: true,
        secure: isHttps,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7일
      })
    );

    // ── 성공 응답 ──────────────────────────────────────────────────
    // 프론트에서는 data를 userInfoAtom에 저장
    return res.status(200).json({
      success: true,
      data: safeUser,
    });
  } catch (error) {
    console.error("Error during sign-in:", error);
    return res.status(500).json({
      success: false,
      message: "서버 오류",
    });
  }
}
