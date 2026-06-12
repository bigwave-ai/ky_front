import type { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'

/*
 * 01. 구분     : API
 * 02. 타입     : GET
 * 03. 업무구분 : 관리자 - 사용자 관리
 * 04. 설명     : 고객사/장비 목록 조회 (TB_CUSTOMER + TB_DEVICE + 코드명 매핑)
 * 05. 작성일자 : 2026.03.31
 * 06. 작성자   : Codex
 */

type ApiCompressorType = {
  id: string
  serialNumber: string
  equipmentTypeCode: string
  equipmentType: string
  equipmentNumber: string
  dataTypeCode: string
  dataType: string
  equipmentPower: string
  deviceName: string
}

type ApiCompanyType = {
  id: string
  name: string
  businessType: string
  handlingItem: string
  managerPhone: string
  managerEmail: string
  accountId: string
  passwordMask: string
  managerName: string
  compressors: ApiCompressorType[]
}

type ApiResponseType = {
  success: boolean
  data: ApiCompanyType[]
  message?: string
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }
const prisma = globalForPrisma.prisma ?? new PrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

const toMask = (raw: string | null | undefined) => {
  const len = Math.max(8, (raw ?? '').length)
  return '*'.repeat(len)
}

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

  try {
    const [deviceTypes, dataTypes, customers] = await Promise.all([
      prisma.tB_DEVICE_TYPE.findMany({
        select: { DEVICE_TYPE: true, NAME: true },
      }),
      prisma.tB_DATA_TYPE.findMany({
        select: { DATA_TYPE: true, NAME: true },
      }),
      prisma.tB_CUSTOMER.findMany({
        select: {
          CUSTOMER_ID: true,
          CUSTOMER_NAME: true,
          CUSTOMER_INDUSTRY: true,
          CUSTOMER_PRODUCT: true,
          CUSTOMER_PHONE: true,
          CUSTOMER_EMAIL: true,
          CUSTOMER_PASSWORD: true,
          CUSTOMER_USER_ID: true,
          TB_DEVICE: {
            select: {
              DEVICE_ID: true,
              SERIAL_NO: true,
              DEVICE_TYPE: true,
              DEVICE_NUM: true,
              DATA_TYPE: true,
              HORSE_POWER: true,
              DEVICE_NAME: true,
            },
            orderBy: { SERIAL_NO: 'asc' },
          },
        },
        orderBy: { CUSTOMER_NAME: 'asc' },
      }),
    ])

    const deviceTypeNameByCode = new Map(
      deviceTypes.map((v) => [String(v.DEVICE_TYPE ?? '').trim(), v.NAME]),
    )
    const dataTypeNameByCode = new Map(
      dataTypes.map((v) => [String(v.DATA_TYPE ?? '').trim(), v.NAME]),
    )

    const data: ApiCompanyType[] = customers.map((customer) => ({
      id: customer.CUSTOMER_ID,
      name: customer.CUSTOMER_NAME ?? '-',
      businessType: customer.CUSTOMER_INDUSTRY ?? '-',
      handlingItem: customer.CUSTOMER_PRODUCT ?? '-',
      managerPhone: customer.CUSTOMER_PHONE ?? '-',
      managerEmail: customer.CUSTOMER_EMAIL ?? '-',
      accountId: customer.CUSTOMER_USER_ID ?? '-',
      passwordMask: toMask(customer.CUSTOMER_PASSWORD),
      managerName: customer.CUSTOMER_NAME ?? '-',
      compressors: (customer.TB_DEVICE ?? []).map((device) => {
        const deviceTypeCode = String(device.DEVICE_TYPE ?? '').trim()
        const dataTypeCode = String(device.DATA_TYPE ?? '').trim()

        return {
          id: device.DEVICE_ID,
          serialNumber: device.SERIAL_NO ?? '-',
          equipmentTypeCode: deviceTypeCode || '-',
          equipmentType: deviceTypeNameByCode.get(deviceTypeCode) ?? (deviceTypeCode || '-'),
          equipmentNumber: device.DEVICE_NUM ?? '-',
          dataTypeCode: dataTypeCode || '-',
          dataType: dataTypeNameByCode.get(dataTypeCode) ?? (dataTypeCode || '-'),
          equipmentPower:
            device.HORSE_POWER !== null && device.HORSE_POWER !== undefined
              ? `${device.HORSE_POWER}`
              : '-',
          deviceName: device.DEVICE_NAME ?? '-',
        }
      }),
    }))

    return res.status(200).json({ success: true, data })
  } catch (error) {
    console.error('[getCustomers] error:', error)
    return res.status(500).json({
      success: false,
      data: [],
      message: '고객사 조회 중 서버 오류가 발생했습니다.',
    })
  }
}
