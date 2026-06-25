import type { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'
import { requireAdminSession } from '../../../app/services/util/api-auth'

/*
 * 01. 구분     : API
 * 02. 타입     : POST
 * 03. 업무구분 : 관리자 - 사용자 관리
 * 04. 설명     : 고객사 추가 (TB_CUSTOMER)
 * 05. 작성일자 : 2026.03.31
 * 06. 작성자   : Codex
 */

type AddCustomerRequestType = {
  accountId?: string
  password?: string
  passwordConfirm?: string
  companyName?: string
  businessType?: string
  handlingItem?: string
  managerName?: string
  managerPhone?: string
  managerEmail?: string
}

type AddCustomerResponseType = {
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
  // 11자리(휴대폰 등): 3-4-4
  if (digits.length === 11) return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
  // 10자리: 02(서울) 2-4-4, 그 외 지역번호 3-3-4
  if (digits.length === 10) {
    return digits.startsWith('02')
      ? `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6)}`
      : `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`
  }
  return value
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AddCustomerResponseType>,
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({
      success: false,
      message: `Method ${req.method} Not Allowed`,
    })
  }

  // 관리자 세션 검증: 비로그인/비관리자 요청 차단
  const session = await requireAdminSession(req, res)
  if (!session) return

  try {
    const body = req.body as AddCustomerRequestType

    const accountId = body.accountId?.trim() ?? ''
    const password = body.password?.trim() ?? ''
    const passwordConfirm = body.passwordConfirm?.trim() ?? ''
    const companyName = body.companyName?.trim() ?? ''
    const businessType = body.businessType?.trim() ?? ''
    const handlingItem = body.handlingItem?.trim() ?? ''
    const managerName = body.managerName?.trim() ?? '' // 스키마에 없음(검증만)
    const managerPhoneRaw = body.managerPhone?.trim() ?? ''
    const managerEmail = body.managerEmail?.trim() ?? ''

    if (
      !accountId ||
      !password ||
      !passwordConfirm ||
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

    if (password !== passwordConfirm) {
      return res.status(400).json({
        success: false,
        message: '비밀번호와 비밀번호 재입력이 일치하지 않습니다.',
      })
    }

    if (!EMAIL_REGEX.test(managerEmail)) {
      return res.status(400).json({
        success: false,
        message: '이메일 형식이 올바르지 않습니다.',
      })
    }

    const phoneDigits = onlyDigits(managerPhoneRaw)
    if (phoneDigits.length !== 10 && phoneDigits.length !== 11) {
      return res.status(400).json({
        success: false,
        message: '연락처는 10~11자리 숫자를 입력해주세요.',
      })
    }

    const exists = await prisma.tB_CUSTOMER.findFirst({
      where: { CUSTOMER_USER_ID: accountId },
      select: { CUSTOMER_ID: true },
    })

    if (exists) {
      return res.status(409).json({
        success: false,
        message: '이미 사용중인 아이디입니다.',
      })
    }

    const customerId = crypto.randomUUID()

    await prisma.tB_CUSTOMER.create({
      data: {
        CUSTOMER_ID: customerId,
        CUSTOMER_NAME: companyName,
        CUSTOMER_INDUSTRY: businessType,
        CUSTOMER_PRODUCT: handlingItem,
        CUSTOMER_AUTH: 'member',
        CUSTOMER_PHONE: formatPhone(managerPhoneRaw),
        CUSTOMER_EMAIL: managerEmail,
        CUSTOMER_PASSWORD: await bcrypt.hash(password, 10),
        CUSTOMER_USER_ID: accountId,
      },
    })

    return res.status(200).json({
      success: true,
      data: { customerId },
    })
  } catch (error) {
    console.error('[addCustomer] error:', error)
    return res.status(500).json({
      success: false,
      message: '고객사 추가 중 서버 오류가 발생했습니다.',
    })
  }
}
