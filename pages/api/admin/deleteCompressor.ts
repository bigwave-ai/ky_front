import type { NextApiRequest, NextApiResponse } from 'next'
import { Prisma, PrismaClient } from '@prisma/client'
import { requireAdminSession } from '../../../app/services/util/api-auth'

type ReqBody = {
  deviceId?: string
}

type ResBody = {
  success: boolean
  data?: { deviceId: string }
  message?: string
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }
const prisma = globalForPrisma.prisma ?? new PrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default async function handler(req: NextApiRequest, res: NextApiResponse<ResBody>) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ success: false, message: `Method ${req.method} Not Allowed` })
  }

  // 관리자 세션 검증: 비로그인/비관리자 요청 차단
  const session = await requireAdminSession(req, res)
  if (!session) return

  try {
    const body = req.body as ReqBody
    const deviceId = body.deviceId?.trim() ?? ''

    if (!deviceId) {
      return res.status(400).json({ success: false, message: '삭제할 장비 ID가 없습니다.' })
    }

    const exists = await prisma.tB_DEVICE.findUnique({
      where: { DEVICE_ID: deviceId },
      select: { DEVICE_ID: true },
    })

    if (!exists) {
      return res.status(404).json({ success: false, message: '삭제 대상 장비를 찾을 수 없습니다.' })
    }

    await prisma.tB_DEVICE.delete({
      where: { DEVICE_ID: deviceId },
    })

    return res.status(200).json({ success: true, data: { deviceId } })
  } catch (error: any) {
    console.error('[deleteCompressor] error:', error)

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
      return res.status(409).json({
        success: false,
        message: '연관된 로그 데이터가 있어 장비를 삭제할 수 없습니다.',
      })
    }

    return res.status(500).json({ success: false, message: '컴프레셔 장비 삭제 중 서버 오류가 발생했습니다.' })
  }
}
