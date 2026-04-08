import type { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'

type ReqBody = {
  customerId?: string
  serialNumber?: string
  deviceName?: string
  deviceTypeCode?: string
  dataTypeCode?: string
  equipmentPower?: string
  equipmentNumber?: string
}

type ResBody = {
  success: boolean
  data?: { deviceId: string }
  message?: string
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }
const prisma = globalForPrisma.prisma ?? new PrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

const NUMERIC_REGEX = /^\d+(\.\d+)?$/
const SERIAL_REGEX = /^\d{10}$/
const INT_REGEX = /^\d+$/
const DEVICE_NAME_MAX_LENGTH = 100

export default async function handler(req: NextApiRequest, res: NextApiResponse<ResBody>) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ success: false, message: `Method ${req.method} Not Allowed` })
  }

  try {
    const body = req.body as ReqBody
    const customerId = body.customerId?.trim() ?? ''
    const serialNumber = body.serialNumber?.trim() ?? ''
    const deviceName = body.deviceName?.trim() ?? ''
    const deviceTypeCode = body.deviceTypeCode?.trim() ?? ''
    const dataTypeCode = body.dataTypeCode?.trim() ?? ''
    const equipmentPower = body.equipmentPower?.trim() ?? ''
    const equipmentNumber = body.equipmentNumber?.trim() ?? ''

    if (!customerId || !serialNumber || !deviceName || !deviceTypeCode || !dataTypeCode || !equipmentPower || !equipmentNumber) {
      return res.status(400).json({ success: false, message: '필수 입력값이 누락되었습니다.' })
    }
    if (!SERIAL_REGEX.test(serialNumber)) {
      return res.status(400).json({ success: false, message: '시리얼 번호는 10자리 숫자여야 합니다.' })
    }
    if (deviceName.length > DEVICE_NAME_MAX_LENGTH) {
      return res.status(400).json({ success: false, message: `장비 명은 ${DEVICE_NAME_MAX_LENGTH}자 이하로 입력해주세요.` })
    }
    if (!NUMERIC_REGEX.test(equipmentPower)) {
      return res.status(400).json({ success: false, message: '장비 마력은 숫자만 입력 가능합니다.' })
    }
    if (!INT_REGEX.test(equipmentNumber)) {
      return res.status(400).json({ success: false, message: '장비 번호는 숫자만 입력 가능합니다.' })
    }

    const [customer, deviceType, dataType, duplicateSerial] = await Promise.all([
      prisma.tB_CUSTOMER.findUnique({ where: { CUSTOMER_ID: customerId }, select: { CUSTOMER_ID: true } }),
      prisma.tB_DEVICE_TYPE.findUnique({ where: { DEVICE_TYPE: deviceTypeCode }, select: { DEVICE_TYPE: true } }),
      prisma.tB_DATA_TYPE.findUnique({ where: { DATA_TYPE: dataTypeCode }, select: { DATA_TYPE: true } }),
      prisma.tB_DEVICE.findFirst({ where: { SERIAL_NO: serialNumber }, select: { DEVICE_ID: true } }),
    ])

    if (!customer) return res.status(404).json({ success: false, message: '고객사를 찾을 수 없습니다.' })
    if (!deviceType) return res.status(400).json({ success: false, message: '유효하지 않은 장비 타입입니다.' })
    if (!dataType) return res.status(400).json({ success: false, message: '유효하지 않은 데이터 타입입니다.' })
    if (duplicateSerial) return res.status(409).json({ success: false, message: '이미 등록된 시리얼 번호입니다.' })

    const deviceId = crypto.randomUUID()
    await prisma.tB_DEVICE.create({
      data: {
        DEVICE_ID: deviceId,
        CUSTOMER_ID: customerId,
        SERIAL_NO: serialNumber,
        DEVICE_NAME: deviceName,
        DEVICE_TYPE: deviceTypeCode,
        DEVICE_NUM: equipmentNumber,
        DATA_TYPE: dataTypeCode,
        HORSE_POWER: Number(equipmentPower),
      },
    })

    return res.status(200).json({ success: true, data: { deviceId } })
  } catch (error) {
    console.error('[addCompressor] error:', error)
    return res.status(500).json({ success: false, message: '컴프레셔 장비 추가 중 서버 오류가 발생했습니다.' })
  }
}
