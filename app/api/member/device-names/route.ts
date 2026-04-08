import { NextRequest, NextResponse } from 'next/server'
import { Prisma, PrismaClient } from '@prisma/client'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RequestBodyType = {
  device_ids?: string[]
}

type ResponseType = {
  success: boolean
  data: Record<string, string>
  message?: string
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }
const prisma = globalForPrisma.prisma ?? new PrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const toFallbackName = (deviceId: string, deviceNum?: string | null, serialNo?: string | null) => {
  const num = String(deviceNum ?? '').trim()
  if (num) return `Compressor${num}`

  const serial = String(serialNo ?? '').trim()
  if (serial) return `Compressor-${serial}`

  return `Compressor-${deviceId.slice(0, 8)}`
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as RequestBodyType
    const inputIds = Array.isArray(body?.device_ids) ? body.device_ids : []

    const normalizedIds = Array.from(
      new Set(inputIds.map((v) => String(v ?? '').trim()).filter(Boolean)),
    )

    const deviceIds = normalizedIds.filter((id) => UUID_REGEX.test(id))

    if (deviceIds.length === 0) {
      const emptyResponse: ResponseType = { success: true, data: {} }
      return NextResponse.json(emptyResponse)
    }

    const devices = await prisma.tB_DEVICE.findMany({
      where: { DEVICE_ID: { in: deviceIds } },
      select: {
        DEVICE_ID: true,
        DEVICE_NUM: true,
        SERIAL_NO: true,
      },
    })

    const byId = new Map(devices.map((d) => [d.DEVICE_ID, d]))
    const nameMap = new Map<string, string>()

    for (const deviceId of deviceIds) {
      const found = byId.get(deviceId)
      nameMap.set(deviceId, toFallbackName(deviceId, found?.DEVICE_NUM, found?.SERIAL_NO))
    }

    try {
      const columnCheck = await prisma.$queryRaw<Array<{ exists: boolean }>>`
        SELECT EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE lower(table_name) = lower('TB_DEVICE')
            AND lower(column_name) = lower('DEVICE_NAME')
        ) AS "exists"
      `

      const hasDeviceName = Boolean(columnCheck?.[0]?.exists)

      if (hasDeviceName) {
        // 핵심: uuid 컬럼과 타입 일치하도록 각 파라미터를 ::uuid 캐스팅
        const castedIds = deviceIds.map((id) => Prisma.sql`${id}::uuid`)

        const rows = await prisma.$queryRaw<Array<{ DEVICE_ID: string; DEVICE_NAME: string | null }>>(
          Prisma.sql`
            SELECT "DEVICE_ID", "DEVICE_NAME"
            FROM "TB_DEVICE"
            WHERE "DEVICE_ID" IN (${Prisma.join(castedIds)})
          `,
        )

        rows.forEach((row) => {
          const name = String(row.DEVICE_NAME ?? '').trim()
          if (name) {
            nameMap.set(row.DEVICE_ID, name)
          }
        })
      }
    } catch (rawError) {
      console.warn('[device-names] DEVICE_NAME lookup skipped:', rawError)
    }

    const response: ResponseType = {
      success: true,
      data: Object.fromEntries(nameMap),
    }

    return NextResponse.json(response)
  } catch (error: any) {
    const response: ResponseType = {
      success: false,
      data: {},
      message: error?.message ?? '장비명 조회 중 오류가 발생했습니다.',
    }
    return NextResponse.json(response, { status: 500 })
  }
}
