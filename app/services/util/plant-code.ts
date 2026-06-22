import crypto from 'crypto'

/*
 * 01. 구분     : Service (Server only)
 * 02. 업무구분 : RAG/DB-agent 연동 - 테넌트 스코프(plant_code) 도출
 * 03. 설명     : V2 고객 customer_id는 fems_cloud PLANT_CD로부터 결정적으로 생성된다
 *               (백엔드 service/mssql_v2_sync_service._customer_uuid_from_plant):
 *                 customer_id = uuid5(NS, `customer-v2:${plant_cd}`)
 *               프론트 DB엔 plant_cd 컬럼이 없으므로(시딩 시 user_id=회사명),
 *               동일 uuid5 공식으로 역사전을 만들어 customer_id → PLANT_CD 를 복원한다.
 *               (실측: V2 고객 192명 중 191명 매핑, plant_cd 정수 4~224. 미매핑 1명=admin 계정)
 * 04. 작성일자 : 2026.06.17
 */

// 백엔드 _UUID_NAMESPACE("3b4f56cc-93e3-4a90-86a6-c481914ca955")와 동일해야 한다.
const NS_HEX = '3b4f56cc93e34a9086a6c481914ca955'

/** RFC4122 v5 (SHA-1) — 백엔드 python uuid.uuid5와 바이트 단위로 일치(검증됨). */
function uuid5(name: string): string {
  const h = crypto.createHash('sha1')
  h.update(Buffer.from(NS_HEX, 'hex'))
  h.update(Buffer.from(name, 'utf8'))
  const b = h.digest().subarray(0, 16)
  b[6] = (b[6] & 0x0f) | 0x50 // version 5
  b[8] = (b[8] & 0x3f) | 0x80 // variant
  const x = b.toString('hex')
  return `${x.slice(0, 8)}-${x.slice(8, 12)}-${x.slice(12, 16)}-${x.slice(16, 20)}-${x.slice(20)}`
}

// 모듈 로드 시 1회 구성. 범위는 실측(4~224)에 넉넉히 기본 1..2000(필요시 PLANT_CODE_RANGE_MAX로 확장).
const RANGE_MAX = Number(process.env.PLANT_CODE_RANGE_MAX || 2000)
const _reverse: Record<string, string> = {}
for (let cd = 1; cd <= RANGE_MAX; cd += 1) {
  _reverse[uuid5(`customer-v2:${cd}`)] = String(cd)
}

/**
 * customer_id(UUID)에서 fems_cloud PLANT_CD를 복원한다. 못 찾으면 null
 * (admin 계정 등 plant 기반이 아닌 customer_id).
 */
export function plantCodeForCustomer(customerId: string | null | undefined): string | null {
  if (!customerId) return null
  return _reverse[String(customerId).trim().toLowerCase()] ?? null
}
