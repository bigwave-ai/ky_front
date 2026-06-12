import type { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'

/*
 * 01. 구분     : API
 * 02. Method   : POST
 * 03. 업무구분 : 관리자 - 사용자 관리
 * 04. 설명     : 고객사 삭제 (TB_CUSTOMER) + 연관 장비/로그 삭제
 * 05. 작성일자 : 2026.03.31
 */

type DeleteCustomerRequestType = {
  customerId?: string
}

type DeleteCustomerResponseType = {
  success: boolean
  data?: {
    customerId: string
    deletedDeviceCount: number
  }
  message?: string
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }
const prisma = globalForPrisma.prisma ?? new PrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<DeleteCustomerResponseType>,
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({
      success: false,
      message: `Method ${req.method} Not Allowed`,
    })
  }

  try {
    const body = req.body as DeleteCustomerRequestType
    const customerId = body.customerId?.trim() ?? ''

    if (!customerId) {
      return res.status(400).json({
        success: false,
        message: '삭제할 고객사 ID가 없습니다.',
      })
    }

    const exists = await prisma.tB_CUSTOMER.findUnique({
      where: { CUSTOMER_ID: customerId },
      select: { CUSTOMER_ID: true },
    })

    if (!exists) {
      return res.status(404).json({
        success: false,
        message: '삭제 대상 고객사를 찾을 수 없습니다.',
      })
    }

    const deletedDeviceCount = await prisma.$transaction(async (tx) => {
      const deviceRows = await tx.tB_DEVICE.findMany({
        where: { CUSTOMER_ID: customerId },
        select: { DEVICE_ID: true },
      })

      const deviceIds = deviceRows.map((d) => d.DEVICE_ID)

      // 고객사 기준 피크런 먼저 삭제 (DEVICE_RESULT는 PEAK_RUN 기준 Cascade)
      await tx.tB_PEAK_DISPATCH_RUN.deleteMany({
        where: { CUSTOMER_ID: customerId },
      })

      if (deviceIds.length > 0) {
        // 혹시 남아있는 결과 행 정리 (DEVICE FK NoAction 대응)
        await tx.tB_PEAK_DISPATCH_DEVICE_RESULT.deleteMany({
          where: { DEVICE_ID: { in: deviceIds } },
        })

        // DEVICE FK 하위 로그 삭제
        await tx.tB_AI_PEMS_LOG.deleteMany({
          where: { DEVICE_ID: { in: deviceIds } },
        })
        await tx.tB_FLOW_LOG.deleteMany({
          where: { DEVICE_ID: { in: deviceIds } },
        })
        await tx.tB_PEMSPROPLUS_LOG.deleteMany({
          where: { DEVICE_ID: { in: deviceIds } },
        })
        await tx.tB_PEMS_PRO_LOG.deleteMany({
          where: { DEVICE_ID: { in: deviceIds } },
        })
        await tx.tB_SIMULATION_LOG.deleteMany({
          where: { DEVICE_ID: { in: deviceIds } },
        })
        await tx.tB_VIBRATION_LOG.deleteMany({
          where: { DEVICE_ID: { in: deviceIds } },
        })
        await tx.tB_WARN_ERROR_LOG.deleteMany({
          where: { DEVICE_ID: { in: deviceIds } },
        })

        // 장비 삭제
        await tx.tB_DEVICE.deleteMany({
          where: { DEVICE_ID: { in: deviceIds } },
        })
      }

      // 고객사 삭제
      await tx.tB_CUSTOMER.delete({
        where: { CUSTOMER_ID: customerId },
      })

      return deviceIds.length
    })

    return res.status(200).json({
      success: true,
      data: { customerId, deletedDeviceCount },
    })
  } catch (error) {
    console.error('[deleteCustomer] error:', error)
    return res.status(500).json({
      success: false,
      message: '고객사 삭제 중 서버 오류가 발생했습니다.',
    })
  }
}
