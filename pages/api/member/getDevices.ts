import type { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'
import { isAdminSession, requireSession } from '../../../app/services/util/api-auth'

/*
 * 01. 구분     : API
 * 02. 타입     : GET
 * 03. 업무구분 : 멤버 - 시뮬레이션
 * 04. 설명     : customer_id 기준 장비 목록(DEVICE_ID, DEVICE_NAME) 조회
 * 05. 작성일자 : 2026.04.13
 * 06. 작성자   : Codex
 */

type DeviceItemType = {
  deviceId: string
  deviceName: string
}

type ApiResponseType = {
  success: boolean
  data: DeviceItemType[]
  message?: string
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }
const prisma = globalForPrisma.prisma ?? new PrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponseType>,
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).json({
      success: false,
      data: [],
      message: `Method ${req.method} Not Allowed`,
    })
  }

  // 로그인 세션 검증
  const session = await requireSession(req, res)
  if (!session) return

  try {
    const customerId =
      typeof req.query.customerId === 'string'
        ? req.query.customerId.trim()
        : ''

    if (!customerId) {
      return res.status(400).json({
        success: false,
        data: [],
        message: 'customerId가 필요합니다.',
      })
    }

    // 비관리자는 본인 고객사의 장비만 조회 가능
    if (!isAdminSession(session) && String(session.customer_id ?? '') !== customerId) {
      return res.status(403).json({
        success: false,
        data: [],
        message: '본인 고객사의 장비만 조회할 수 있습니다.',
      })
    }

    const devices = await prisma.tB_DEVICE.findMany({
      where: { CUSTOMER_ID: customerId },
      select: {
        DEVICE_ID: true,
        DEVICE_NAME: true,
        DEVICE_NUM: true,
        SERIAL_NO: true,
      },
      orderBy: [{ DEVICE_NUM: 'asc' }, { SERIAL_NO: 'asc' }],
    })

    const data: DeviceItemType[] = devices.map((d, idx) => {
      const name = String(d.DEVICE_NAME ?? '').trim()
      const num = String(d.DEVICE_NUM ?? '').trim()
      const serial = String(d.SERIAL_NO ?? '').trim()

      return {
        deviceId: d.DEVICE_ID,
        deviceName:
          name ||
          (num ? `Compressor ${num}` : serial ? `Compressor-${serial}` : `Compressor ${idx + 1}`),
      }
    })

    return res.status(200).json({ success: true, data })
  } catch (error) {
    console.error('[getDevices] error:', error)
    return res.status(500).json({
      success: false,
      data: [],
      message: '장비 목록 조회 중 서버 오류가 발생했습니다.',
    })
  }
}
