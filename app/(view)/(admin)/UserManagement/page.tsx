'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import umc from './UserManagement.module.css'
import imag from '@/app/components/style/resources/css/image.module.css'
import AddModal, { type AddCompanyFormType } from '@/app/components/libs/modals/modal-add-user'
import UpdateUserModal, {
  type UpdateCompanyFormType,
  type UpdateCompanyInitialDataType,
} from '@/app/components/libs/modals/modal-update-user'
import AddCompressorModal, {
  type AddCompressorFormType,
  type CompressorSelectOptionType,
} from '@/app/components/libs/modals/modal-add-compressor'
import UpdateCompressorModal, {
  type UpdateCompressorFormType,
  type UpdateCompressorInitialDataType,
} from '@/app/components/libs/modals/modal-update-compressor'

/*
 * 01. 구분     : Page 컴포넌트
 * 02. 타입     : Client Component
 * 03. 업무구분  : 관리자 권한 - 사용자 관리 페이지
 * 04. 설명     : 고객사/컴프레셔 정보 조회 및 관리 UI 제공
 * 05. 작성일자  : 2026.03.30
 * 06. 작성자   : 이우창
 */

type CompressorType = {
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

type CompressorMetaApiResponseType = {
  success: boolean
  data: {
    deviceTypes: CompressorSelectOptionType[]
    dataTypes: CompressorSelectOptionType[]
  }
  message?: string
}

type AddCompressorApiResponseType = {
  success: boolean
  data?: { deviceId: string }
  message?: string
}

type EditCompressorApiResponseType = {
  success: boolean
  data?: { deviceId: string }
  message?: string
}

type DeleteCompressorApiResponseType = {
  success: boolean
  data?: { deviceId: string }
  message?: string
}

type CompanyType = {
  id: string
  name: string
  businessType: string
  handlingItem: string
  managerPhone: string
  managerEmail: string
  accountId: string
  passwordMask: string
  managerName: string
  compressors: CompressorType[]
}

type GetCustomersApiResponseType = {
  success: boolean
  data: CompanyType[]
  message?: string
}

type AddCustomerApiResponseType = {
  success: boolean
  data?: {
    customerId: string
  }
  message?: string
}

type EditCustomerApiResponseType = {
  success: boolean
  data?: {
    customerId: string
  }
  message?: string
}

type DeleteCustomerApiResponseType = {
  success: boolean
  data?: {
    customerId: string
  }
  message?: string
}

export default function UserManagementPage() {
  /******************** 변수 영역 ********************/
  const [companyKeyword, setCompanyKeyword] = useState('')
  const [compressorKeyword, setCompressorKeyword] = useState('')
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)

  const rowsPerPage = 10

  const [companies, setCompanies] = useState<CompanyType[]>([])
  const [isCustomersLoading, setIsCustomersLoading] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isAddSubmitting, setIsAddSubmitting] = useState(false)
  const [apiError, setApiError] = useState('')

  const filteredCompanies = useMemo(() => {
    const keyword = companyKeyword.trim().toLowerCase()
    if (!keyword) return companies

    return companies.filter((company) =>
      [company.name, company.businessType, company.handlingItem, company.managerPhone, company.managerEmail]
        .some((field) => field.toLowerCase().includes(keyword)),
    )
  }, [companyKeyword, companies])
 
  const totalPages = Math.max(1, Math.ceil(filteredCompanies.length / rowsPerPage))

  const pagedCompanies = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage
    return filteredCompanies.slice(start, start + rowsPerPage)
  }, [currentPage, filteredCompanies])

  const selectedCompany = useMemo(
    () => companies.find((company) => company.id === selectedCompanyId) ?? companies[0] ?? null,
    [selectedCompanyId, companies],
  )

  const filteredCompressors = useMemo(() => {
    if (!selectedCompany) return []
    const keyword = compressorKeyword.trim().toLowerCase()
    if (!keyword) return selectedCompany.compressors

    return selectedCompany.compressors.filter((cp) =>
      [cp.serialNumber, cp.deviceName, cp.equipmentType, cp.equipmentNumber, cp.dataType, cp.equipmentPower].some((field) =>
        field.toLowerCase().includes(keyword),
      ),
    )
  }, [compressorKeyword, selectedCompany])

  const updateModalInitialData = useMemo<UpdateCompanyInitialDataType | null>(() => {
    if (!selectedCompany) return null

    return {
      customerId: selectedCompany.id,
      accountId: selectedCompany.accountId ?? '',
      companyName: selectedCompany.name ?? '',
      businessType: selectedCompany.businessType ?? '',
      handlingItem: selectedCompany.handlingItem ?? '',
      managerName: selectedCompany.managerName ?? '',
      managerPhone: selectedCompany.managerPhone ?? '',
      managerEmail: selectedCompany.managerEmail ?? '',
    }
  }, [selectedCompany])

  const customerCount = companies.length
  const compressorCount = companies.reduce((acc, company) => acc + company.compressors.length, 0)

  const pageNumbers = useMemo(() => Array.from({ length: totalPages }, (_, i) => i + 1), [totalPages])
  const [detailPanelMotion, setDetailPanelMotion] = useState(0)

  const leftPanelRef = useRef<HTMLElement | null>(null)
  const [matchedRightHeight, setMatchedRightHeight] = useState(0)  

  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false)
  const [isUpdateSubmitting, setIsUpdateSubmitting] = useState(false)
  const [isDeleteSubmitting, setIsDeleteSubmitting] = useState(false)

  const [deviceTypeOptions, setDeviceTypeOptions] = useState<CompressorSelectOptionType[]>([])
  const [dataTypeOptions, setDataTypeOptions] = useState<CompressorSelectOptionType[]>([])

  const [isAddCompressorModalOpen, setIsAddCompressorModalOpen] = useState(false)
  const [isAddCompressorSubmitting, setIsAddCompressorSubmitting] = useState(false)

  const [selectedCompressorId, setSelectedCompressorId] = useState('')
  const [isUpdateCompressorModalOpen, setIsUpdateCompressorModalOpen] = useState(false)
  const [isUpdateCompressorSubmitting, setIsUpdateCompressorSubmitting] = useState(false)
  const [isDeleteCompressorSubmitting, setIsDeleteCompressorSubmitting] = useState(false)

  const selectedCompressor = useMemo(
    () => selectedCompany?.compressors.find((cp) => cp.id === selectedCompressorId) ?? null,
    [selectedCompany, selectedCompressorId],
  )

  const updateCompressorInitialData = useMemo<UpdateCompressorInitialDataType | null>(() => {
    if (!selectedCompressor) return null
    return {
      deviceId: selectedCompressor.id,
      serialNumber: selectedCompressor.serialNumber === '-' ? '' : selectedCompressor.serialNumber,
      deviceTypeCode:
        selectedCompressor.equipmentTypeCode && selectedCompressor.equipmentTypeCode !== '-'
          ? selectedCompressor.equipmentTypeCode
          : '',
      dataTypeCode:
        selectedCompressor.dataTypeCode && selectedCompressor.dataTypeCode !== '-'
          ? selectedCompressor.dataTypeCode
          : '',
      equipmentPower: selectedCompressor.equipmentPower === '-' ? '' : selectedCompressor.equipmentPower,
      equipmentNumber: selectedCompressor.equipmentNumber === '-' ? '' : selectedCompressor.equipmentNumber,
      deviceName: selectedCompressor.deviceName === '-' ? '' : selectedCompressor.deviceName,
    }
  }, [selectedCompressor])

  /******************** 함수 영역 ********************/
  const handleSelectCompany = (companyId: string) => {
    setSelectedCompanyId(companyId)
    setCompressorKeyword('')
    setDetailPanelMotion((prev) => prev + 1)
  }

  const handleAddCompany = async (form: AddCompanyFormType) => {
    if (isAddSubmitting) return;
    setIsAddSubmitting(true);

    try {
      const response = await fetch('/api/admin/addCustomer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const json = (await response.json()) as AddCustomerApiResponseType;

      if (!response.ok || !json.success) {
        const message =
          response.status === 409
            ? '이미 사용중인 아이디입니다.'
            : json.message ?? '고객사 추가에 실패했습니다.';
        throw new Error(message);
      }

      setIsAddModalOpen(false);
      await fetchCustomers(json.data?.customerId);
      setCurrentPage(1);
    } finally {
      setIsAddSubmitting(false);
    }
  };
  
  const fetchCustomers = useCallback(async (preferredId?: string) => {
    setIsCustomersLoading(true)
    setApiError('')

    try {
      const response = await fetch('/api/admin/getCustomers', { method: 'GET' })
      const json = (await response.json()) as GetCustomersApiResponseType

      if (!response.ok || !json.success) {
        throw new Error(json.message ?? '고객사 조회 실패')
      }

      const nextCompanies = Array.isArray(json.data) ? json.data : []
      setCompanies(nextCompanies)

      setSelectedCompanyId((prev) => {
        const candidate = preferredId ?? prev
        if (candidate && nextCompanies.some((c) => c.id === candidate)) return candidate
        return nextCompanies[0]?.id ?? ''
      })
    } catch (error: any) {
      console.error(error)
      setApiError(error?.message ?? '고객사 목록을 불러오지 못했습니다.')
      setCompanies([])
      setSelectedCompanyId('')
    } finally {
      setIsCustomersLoading(false)
    }
  }, [])

  const handleOpenUpdateModal = () => {
    if (!selectedCompany) return
    setIsUpdateModalOpen(true)
  }

  const handleUpdateCompany = async (form: UpdateCompanyFormType) => {
    if (isUpdateSubmitting) return
    setIsUpdateSubmitting(true)

    try {
      const response = await fetch('/api/admin/editCustomer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const json = (await response.json()) as EditCustomerApiResponseType

      if (!response.ok || !json.success) {
        const message =
          response.status === 409
            ? '이미 사용중인 아이디입니다.'
            : json.message ?? '고객사 정보 변경에 실패했습니다.'
        throw new Error(message)
      }

      setIsUpdateModalOpen(false)
      await fetchCustomers(form.customerId)
    } finally {
      setIsUpdateSubmitting(false)
    }
  }

  const handleDeleteCompany = async (customerId: string) => {
    if (isDeleteSubmitting) return
    setIsDeleteSubmitting(true)

    try {
      const response = await fetch('/api/admin/deleteCustomer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId }),
      })

      const json = (await response.json()) as DeleteCustomerApiResponseType

      if (!response.ok || !json.success) {
        throw new Error(json.message ?? '고객사 삭제에 실패했습니다.')
      }

      setIsUpdateModalOpen(false)
      setCurrentPage(1)
      await fetchCustomers()
    } finally {
      setIsDeleteSubmitting(false)
    }
  }

  const fetchCompressorMeta = useCallback(async () => {
    const response = await fetch('/api/admin/getCompressorMeta', { method: 'GET' })
    const json = (await response.json()) as CompressorMetaApiResponseType
    if (!response.ok || !json.success) {
      throw new Error(json.message ?? '장비 코드 목록 조회 실패')
    }
    setDeviceTypeOptions(json.data.deviceTypes ?? [])
    setDataTypeOptions(json.data.dataTypes ?? [])
  }, [])

const handleOpenAddCompressorModal = () => {
  if (!selectedCompany) return
  setIsAddCompressorModalOpen(true)
}

const handleOpenUpdateCompressorModal = (deviceId: string) => {
  setSelectedCompressorId(deviceId)
  setIsUpdateCompressorModalOpen(true)
}

const handleAddCompressor = async (form: AddCompressorFormType) => {
  if (!selectedCompany) throw new Error('고객사를 먼저 선택해주세요.')
  if (isAddCompressorSubmitting) return
  setIsAddCompressorSubmitting(true)

  try {
    const response = await fetch('/api/admin/addCompressor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerId: selectedCompany.id, ...form }),
    })
    const json = (await response.json()) as AddCompressorApiResponseType
    if (!response.ok || !json.success) throw new Error(json.message ?? '컴프레셔 장비 추가 실패')

    setIsAddCompressorModalOpen(false)
    await fetchCustomers(selectedCompany.id)
  } finally {
    setIsAddCompressorSubmitting(false)
  }
}

  const handleUpdateCompressor = async (form: UpdateCompressorFormType) => {
    if (!selectedCompany) throw new Error('고객사를 먼저 선택해주세요.')
    if (isUpdateCompressorSubmitting) return
    setIsUpdateCompressorSubmitting(true)

    try {
      const response = await fetch('/api/admin/editCompressor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: selectedCompany.id, ...form }),
      })
      const json = (await response.json()) as EditCompressorApiResponseType
      if (!response.ok || !json.success) throw new Error(json.message ?? '컴프레셔 장비 수정 실패')

      setIsUpdateCompressorModalOpen(false)
      await fetchCustomers(selectedCompany.id)
    } finally {
      setIsUpdateCompressorSubmitting(false)
    }
  }

  const handleDeleteCompressor = async (deviceId: string) => {
    if (isDeleteCompressorSubmitting) return
    setIsDeleteCompressorSubmitting(true)

    try {
      const response = await fetch('/api/admin/deleteCompressor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId }),
      })
      const json = (await response.json()) as DeleteCompressorApiResponseType
      if (!response.ok || !json.success) throw new Error(json.message ?? '컴프레셔 장비 삭제 실패')

      setIsUpdateCompressorModalOpen(false)
      await fetchCustomers(selectedCompany?.id)
    } finally {
      setIsDeleteCompressorSubmitting(false)
    }
  }

  /******************** 수행 영역 ********************/

  useEffect(() => {
    fetchCustomers()
    fetchCompressorMeta().catch((e) => {
      console.error(e)
      setApiError(e?.message ?? '장비 코드 목록을 불러오지 못했습니다.')
    })
  }, [fetchCustomers, fetchCompressorMeta])

  useEffect(() => {
    if (!filteredCompanies.length) {
      setSelectedCompanyId('')
      return
    }

    const exists = filteredCompanies.some((company) => company.id === selectedCompanyId)
    if (!exists) {
      setSelectedCompanyId(filteredCompanies[0].id)
    }
  }, [filteredCompanies, selectedCompanyId])

  useEffect(() => {
    const el = leftPanelRef.current
    if (!el) return

    const updateHeight = () => {
      setMatchedRightHeight(Math.ceil(el.getBoundingClientRect().height))
    }

    updateHeight()
    const observer = new ResizeObserver(updateHeight)
    observer.observe(el)

    return () => observer.disconnect()
  }, [currentPage, companyKeyword, filteredCompanies.length])

  return (
    <div className={umc.user_root}>
      <header className={umc.user_pageHead}>
        <h1>고객사 및 컴프레셔 관리</h1>
        <p>고객사와 해당 고객사의 컴프레셔 정보를 관리할 수 있는 페이지입니다.</p>
      </header>

      <section className={umc.user_statCard}>
        <div className={umc.user_cardTitleWrap}>
          <h2>고객사 및 컴프레셔 통계</h2>
          <p>현재, 고객사의 수와 전체 컴프레셔 등록 수 입니다.</p>
        </div>

        <div className={umc.user_statPills}>
          <div className={umc.user_statPill}>
            <span>고객사 수</span>
            <strong>{customerCount.toLocaleString('ko-KR')}</strong>
          </div>
          <div className={umc.user_statPill}>
            <span>컴프레셔 수</span>
            <strong>{compressorCount.toLocaleString('ko-KR')}</strong>
          </div>
        </div>
      </section>

      <section className={umc.user_grid}>
        <article ref={leftPanelRef} className={`${umc.user_panel} ${umc.user_leftPanel}`}>
          <div className={umc.user_panelHead}>
            <div className={umc.user_panelTitleWrap}>
              <h3>고객사 관리</h3>
              <p>고객사에 대해 추가/삭제/수정할 수 있습니다.</p>
            </div>
            <button type="button" className={umc.user_addBtn} onClick={() => setIsAddModalOpen(true)}>
              추가하기
            </button>
          </div>

          <div className={umc.user_searchRow}>
            <input
              type="text"
              value={companyKeyword}
              onChange={(e) => {
                setCompanyKeyword(e.target.value)
                setCurrentPage(1)
              }}
              className={umc.user_searchInput}
              placeholder="고객사, 업종, 취급물품, 연락처, 메일 등 텍스트를 검색해주세요."
            />
            <button type="button" className={umc.user_searchBtn} aria-label="고객사 검색">
              <i className={imag.search_grey_icon} aria-hidden="true" />
            </button>
          </div>

          {apiError ? (
            <div style={{ color: '#d14343', fontSize: '13px', fontWeight: 700, marginTop: '8px' }}>
              {apiError}
            </div>
          ) : null}

          <div className={umc.user_tableWrap}>
            <table className={umc.user_table}>
              <thead>
                <tr>
                  <th>고객사</th>
                  <th>업종</th>
                  <th>취급물품</th>
                  <th>담당자 연락처</th>
                  <th>담당자 메일</th>
                </tr>
              </thead>
                <tbody>
                  {isCustomersLoading ? (
                    <tr>
                      <td colSpan={5} className={umc.user_emptyCell}>고객사 정보를 불러오는 중입니다.</td>
                    </tr>
                  ) : pagedCompanies.length ? (
                    pagedCompanies.map((company) => (
                      <tr
                        key={company.id}
                        className={selectedCompany?.id === company.id ? umc.user_tableRowActive : ''}
                        onClick={() => handleSelectCompany(company.id)}
                      >
                        <td>{company.name}</td>
                        <td>{company.businessType}</td>
                        <td>{company.handlingItem}</td>
                        <td>{company.managerPhone}</td>
                        <td>{company.managerEmail}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className={umc.user_emptyCell}>검색 결과가 없습니다.</td>
                    </tr>
                  )}
                </tbody>
            </table>
          </div>

          <div className={umc.user_pagination}>
            <button
              type="button"
              className={umc.user_pageArrow}
              aria-label="이전 페이지"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            >
              &lt;
            </button>

            {pageNumbers.map((page) => (
              <button
                key={page}
                type="button"
                className={`${umc.user_pageNum} ${page === currentPage ? umc.user_pageNumActive : ''}`}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ))}

            <button
              type="button"
              className={umc.user_pageArrow}
              aria-label="다음 페이지"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            >
              &gt;
            </button>
          </div>
        </article>

        <article
          key={detailPanelMotion}
          className={`${umc.user_panel} ${umc.user_rightPanel} ${umc.user_rightPanelSlideIn}`}
          style={matchedRightHeight ? { height: `${matchedRightHeight}px` } : undefined}
        >
          <div className={umc.user_panelHead}>
            <div className={umc.user_panelTitleWrap}>
              <h3>{selectedCompany?.name ?? '-'}</h3>
              <p>고객사에 대한 컴프레셔 정보를 확인해주세요.</p>
            </div>
            <button type="button" className={umc.user_addBtn} onClick={handleOpenAddCompressorModal}>
              추가하기
            </button>
          </div>

          <div className={umc.user_searchRow}>
            <input
              type="text"
              value={compressorKeyword}
              onChange={(e) => setCompressorKeyword(e.target.value)}
              className={umc.user_searchInput}
              placeholder="컴프레셔에 대한 정보를 검색해주세요."
            />
            <button type="button" className={umc.user_searchBtn} aria-label="컴프레셔 검색">
              <i className={imag.search_grey_icon} aria-hidden="true" />
            </button>
          </div>

          <div className={umc.user_detailScroll}>
            <section className={umc.user_infoCard}>
              <div className={umc.user_infoHead}>
                <div className={umc.user_infoTitleWrap}>
                  <h4>고객 정보</h4>
                  <p>고객 정보 중 수정 가능한 정보를 확인하시고 변경사항이 있을 시 변경해주세요.</p>
                </div>
                <button type="button" className={umc.user_changeBtn} onClick={handleOpenUpdateModal}>
                  변경하기
                </button>
              </div>

              <div className={umc.user_infoRows}>
                <div className={umc.user_infoRow}>
                  <div className={umc.user_labelCell}>아이디</div>
                  <div className={umc.user_valueCell}>{selectedCompany?.accountId ?? '-'}</div>
                </div>
                <div className={umc.user_infoRow}>
                  <div className={umc.user_labelCell}>비밀번호</div>
                  <div className={umc.user_valueCell}>{selectedCompany?.passwordMask ?? '-'}</div>
                </div>
                <div className={umc.user_infoRow}>
                  <div className={umc.user_labelCell}>담당자명</div>
                  <div className={umc.user_valueCell}>{selectedCompany?.managerName ?? '-'}</div>
                </div>
              </div>
            </section>

            {filteredCompressors.length ? (
              filteredCompressors.map((cp, index) => (
                <section key={cp.id} className={umc.user_infoCard}>
                  <div className={umc.user_infoHead}>
                    <div className={umc.user_infoTitleWrap}>
                      <h4>컴프레셔 장비 {cp.equipmentNumber && cp.equipmentNumber !== '-' ? cp.equipmentNumber : index + 1}</h4>
                    </div>
                    <button
                      type="button"
                      className={umc.user_changeBtn}
                      onClick={() => handleOpenUpdateCompressorModal(cp.id)}
                    >
                      변경하기
                    </button>
                  </div>

                  <div className={umc.user_infoRows}>
                    <div className={umc.user_infoRow}>
                      <div className={umc.user_labelCell}>장비 명</div>
                      <div className={umc.user_valueCell}>{cp.deviceName}</div>
                    </div>
                    <div className={umc.user_infoRow}>
                      <div className={umc.user_labelCell}>시리얼 번호</div>
                      <div className={umc.user_valueCell}>{cp.serialNumber}</div>
                    </div>
                    <div className={umc.user_infoRow}>
                      <div className={umc.user_labelCell}>장비 타입</div>
                      <div className={umc.user_valueCell}>{cp.equipmentType}</div>
                    </div>
                    <div className={umc.user_infoRow}>
                      <div className={umc.user_labelCell}>데이터 타입</div>
                      <div className={umc.user_valueCell}>{cp.dataType}</div>
                    </div>
                    <div className={umc.user_infoRow}>
                      <div className={umc.user_labelCell}>장비 마력</div>
                      <div className={umc.user_valueCell}>{cp.equipmentPower}</div>
                    </div>
                  </div>
                </section>
              ))
            ) : (
              <div className={umc.user_emptyDetail}>조건에 맞는 컴프레셔가 없습니다.</div>
            )}
          </div>
        </article>
      </section>

    <AddModal
      open={isAddModalOpen}
      onClose={() => setIsAddModalOpen(false)}
      onSubmit={handleAddCompany}
    />

    <UpdateUserModal
      open={isUpdateModalOpen}
      onClose={() => setIsUpdateModalOpen(false)}
      onSubmit={handleUpdateCompany}
      onDelete={handleDeleteCompany}
      initialData={updateModalInitialData}
      isSubmitting={isUpdateSubmitting}
      isDeleting={isDeleteSubmitting}
    />

    <AddCompressorModal
      open={isAddCompressorModalOpen}
      onClose={() => setIsAddCompressorModalOpen(false)}
      onSubmit={handleAddCompressor}
      deviceTypeOptions={deviceTypeOptions}
      dataTypeOptions={dataTypeOptions}
    />

    <UpdateCompressorModal
      open={isUpdateCompressorModalOpen}
      onClose={() => setIsUpdateCompressorModalOpen(false)}
      onSubmit={handleUpdateCompressor}
      onDelete={handleDeleteCompressor}
      initialData={updateCompressorInitialData}
      deviceTypeOptions={deviceTypeOptions}
      dataTypeOptions={dataTypeOptions}
      isSubmitting={isUpdateCompressorSubmitting}
      isDeleting={isDeleteCompressorSubmitting}
    />

    </div>
  )
}
