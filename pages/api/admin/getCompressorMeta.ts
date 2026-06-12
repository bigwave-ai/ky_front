import type { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'
import { requireAdminSession } from '../../../app/services/util/api-auth'

type OptionType = {
  code: string
  name: string
}

type ApiResponseType = {
  success: boolean
  data: {
    deviceTypes: OptionType[]
    dataTypes: OptionType[]
  }
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
      data: { deviceTypes: [], dataTypes: [] },
      message: `Method ${req.method} Not Allowed`,
    })
  }

  // 관리자 세션 검증: 비로그인/비관리자 요청 차단
  const session = await requireAdminSession(req, res)
  if (!session) return

  try {
    const [deviceTypes, dataTypes] = await Promise.all([
      prisma.tB_DEVICE_TYPE.findMany({
        orderBy: { NAME: 'asc' },
        select: { DEVICE_TYPE: true, NAME: true },
      }),
      prisma.tB_DATA_TYPE.findMany({
        orderBy: { NAME: 'asc' },
        select: { DATA_TYPE: true, NAME: true },
      }),
    ])

    return res.status(200).json({
      success: true,
      data: {
        deviceTypes: deviceTypes.map((v) => ({ code: v.DEVICE_TYPE, name: v.NAME })),
        dataTypes: dataTypes.map((v) => ({ code: v.DATA_TYPE, name: v.NAME })),
      },
    })
  } catch (error) {
    console.error('[getCompressorMeta] error:', error)
    return res.status(500).json({
      success: false,
      data: { deviceTypes: [], dataTypes: [] },
      message: '장비 코드 정보 조회 중 서버 오류가 발생했습니다.',
    })
  }
}
