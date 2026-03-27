import type { NextApiRequest, NextApiResponse } from "next";
import { serialize } from "cookie";

/*
 * 01. 구분     : API
 * 02. 타입     : POST
 * 03. 업무구분  : 로그아웃
 * 04. 설명     : 쿠키 삭제
 * 05. 작성일자  : 2024.12.3
 * 06. 작성자   : 이우창
 */

const COOKIE_NAME = "session-Info";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ message: `Method ${req.method} not allowed` });
  }

  try {
    // ✅ signin.ts와 "정확히 동일한" 기준으로 secure 판별
    const forwardedProto = String(
      req.headers["x-forwarded-proto"] || req.headers["X-Forwarded-Proto"] || ""
    ).toLowerCase();
    const isHttps = forwardedProto.includes("https");

    // ✅ signin.ts와 "정확히 동일한" sameSite / path 사용
    // 만료는 expires 또는 maxAge:0 둘 중 하나면 충분 (여기선 maxAge:0 사용)
    const expired = serialize(COOKIE_NAME, "", {
      httpOnly: true,
      secure: isHttps,    // ← signin.ts와 동일
      sameSite: "lax",    // ← signin.ts와 동일
      path: "/",          // ← signin.ts와 동일
      maxAge: 0,          // ← 즉시 만료
      // expires: new Date(0) // (대신 이걸 써도 무방, 둘 다 쓸 필요는 없음)
    });

    res.setHeader("Set-Cookie", expired);
    return res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    console.error("Error deleting cookie:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
