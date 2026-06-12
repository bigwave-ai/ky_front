import { SignJWT, jwtVerify } from "jose";

/*
 * 01. 구분     : Service
 * 02. 타입     : -
 * 03. 업무구분  : 모든권한 - token 생성
 * 03. 설명     : json web token 생성
 * 04. 작성일자  : 2024.12.03
 * 05. 작성자   : 채승완
 */

/**
 * JWT 토큰 생성
 * @param payload - 토큰에 포함할 데이터 (예시: 사용자 정보)
 * @param expiresIn - 토큰 만료 기간 (예시: [1m,7d] )
 * @returns 생성된 JWT 토큰
 */

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export async function jwtToken(
  payload: Record<string, any>,
  expiresIn = "7d"
): Promise<string> {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(expiresIn)
    .sign(SECRET);
}

/**
 * JWT 토큰 검증
 * @param token - 검증할 JWT 토큰
 * @returns 디코딩된 데이터 또는 null
 */

export async function verifyJwtToken(
  token: string
): Promise<Record<string, any> | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as Record<string, any>;
  } catch (error) {
    console.error("Invalid or expired JWT token:", error);
    return null;
  }
}
