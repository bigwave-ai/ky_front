import type { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'

/*
 * 01. 구분     : API
 * 02. 타입     : POST
 * 03. 업무구분 : 관리자 - 사용자 관리
 * 04. 설명     : 고객사 정보 수정 (TB_CUSTOMER)
 * 05. 작성일자 : 2026.03.31
 * 06. 작성자   : 이우창
 */

type EditCustomerRequestType = {
  customerId?: string
  accountId?: string
  companyName?: string
  businessType?: string
  handlingItem?: string
  managerName?: string
  managerPhone?: string
  managerEmail?: string
  newPassword?: string
  newPasswordConfirm?: string
}

type EditCustomerResponseType = {
  success: boolean
  data?: {
    customerId: string
  }
  message?: string
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }
const prisma = globalForPrisma.prisma ?? new PrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const onlyDigits = (value: string) => value.replace(/\D/g, '')

const formatPhone = (value: string) => {
  const digits = onlyDigits(value).slice(0, 11)
  if (digits.length !== 11) return value
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`
}

const encodeBase64 = (raw: string) => Buffer.from(raw, 'utf-8').toString('base64')

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<EditCustomerResponseType>,
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({
      success: false,
      message: `Method ${req.method} Not Allowed`,
    })
  }

  try {
    const body = req.body as EditCustomerRequestType

    const customerId = body.customerId?.trim() ?? ''
    const accountId = body.accountId?.trim() ?? ''
    const companyName = body.companyName?.trim() ?? ''
    const businessType = body.businessType?.trim() ?? ''
    const handlingItem = body.handlingItem?.trim() ?? ''
    const managerName = body.managerName?.trim() ?? '' // 스키마에 컬럼 없음(검증만)
    const managerPhoneRaw = body.managerPhone?.trim() ?? ''
    const managerEmail = body.managerEmail?.trim() ?? ''
    const newPassword = body.newPassword?.trim() ?? ''
    const newPasswordConfirm = body.newPasswordConfirm?.trim() ?? ''

    if (
      !customerId ||
      !accountId ||
      !companyName ||
      !businessType ||
      !handlingItem ||
      !managerName ||
      !managerPhoneRaw ||
      !managerEmail
    ) {
      return res.status(400).json({
        success: false,
        message: '필수 입력값이 누락되었습니다.',
      })
    }

    if (!EMAIL_REGEX.test(managerEmail)) {
      return res.status(400).json({
        success: false,
        message: '이메일 형식이 올바르지 않습니다.',
      })
    }

    const phoneDigits = onlyDigits(managerPhoneRaw)
    if (phoneDigits.length !== 11) {
      return res.status(400).json({
        success: false,
        message: '연락처는 11자리 숫자를 입력해주세요.',
      })
    }

    const hasAnyNewPassword = Boolean(newPassword || newPasswordConfirm)
    if (hasAnyNewPassword) {
      if (!newPassword || !newPasswordConfirm) {
        return res.status(400).json({
          success: false,
          message: '새로운 비밀번호/재입력을 모두 입력해주세요.',
        })
      }
      if (newPassword !== newPasswordConfirm) {
        return res.status(400).json({
          success: false,
          message: '새로운 비밀번호와 재입력이 일치하지 않습니다.',
        })
      }
    }

    const exists = await prisma.tB_CUSTOMER.findUnique({
      where: { CUSTOMER_ID: customerId },
      select: { CUSTOMER_ID: true },
    })

    if (!exists) {
      return res.status(404).json({
        success: false,
        message: '수정 대상 고객사를 찾을 수 없습니다.',
      })
    }

    const duplicate = await prisma.tB_CUSTOMER.findFirst({
      where: {
        CUSTOMER_USER_ID: accountId,
        NOT: { CUSTOMER_ID: customerId },
      },
      select: { CUSTOMER_ID: true },
    })

    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: '이미 사용중인 아이디입니다.',
      })
    }

    const updateData: Record<string, unknown> = {
      CUSTOMER_NAME: companyName,
      CUSTOMER_INDUSTRY: businessType,
      CUSTOMER_PRODUCT: handlingItem,
      CUSTOMER_PHONE: formatPhone(managerPhoneRaw),
      CUSTOMER_EMAIL: managerEmail,
      CUSTOMER_USER_ID: accountId,
      // managerName 은 현재 스키마에 별도 컬럼이 없어 저장하지 않음
    }

    if (hasAnyNewPassword && newPassword) {
      updateData.CUSTOMER_PASSWORD = encodeBase64(newPassword)
    }

    await prisma.tB_CUSTOMER.update({
      where: { CUSTOMER_ID: customerId },
      data: updateData,
    })

    return res.status(200).json({
      success: true,
      data: { customerId },
    })
  } catch (error) {
    console.error('[editCustomer] error:', error)
    return res.status(500).json({
      success: false,
      message: '고객사 정보 수정 중 서버 오류가 발생했습니다.',
    })
  }
}
