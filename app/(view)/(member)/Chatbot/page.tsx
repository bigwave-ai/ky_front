'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import cbc from './Chatbot.module.css'
import imag from '@/app/components/style/resources/css/image.module.css'

/*
 * 01. 구분     : Page 컴포넌트
 * 02. 타입     : Client Component
 * 03. 업무구분  : 멤버권한 - 통합 AI 챗봇
 * 04. 설명     : 채팅 송수신, 스트리밍 응답 렌더링, 참고문헌 패널(이미지/페이지/확대축소) UI 제공
 * 05. 작성일자  : 2026.04.20
 * 06. 작성자   : 이우창
 */

/******************** 변수 영역 ********************/
type SpeakerType = 'user' | 'bot' // 메시지 발화자 타입

type ReferenceImageType = {
  url: string
  title?: string
  page?: number | string
  name?: string
} // 참고문헌 이미지 타입

type ChatMessageType = {
  id: string
  speaker: SpeakerType
  message: string
  timestamp: string
  reference_image?: ReferenceImageType[]
  reference?: unknown[]
} // 채팅 메시지 타입

type ChatApiResponseType = {
  success: boolean
  data: ChatMessageType[]
  message?: string
  timestamp: string
} // 채팅 API 응답 타입

const SESSION_KEY = 'chatSessionId' // 세션 ID 저장 키
const CHAT_HISTORY_KEY_PREFIX = 'chat_history_' // 채팅 이력 저장 키 prefix
const DEFAULT_REFERENCE_TEXT =
  '설정 압력보다 낮은 운전이 지속될 경우, 흡입 필터 막힘, 흡입 밸브 고착, 압력 센서 오작동 또는 배출 라인 누설 가능성을 우선 점검해야 합니다.' // 참고문헌 기본 문구

/******************** 함수 영역 ********************/
// 세션 ID를 생성하는 함수
const createSessionId = () => `session_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`

// 세션 ID를 생성/반환하고 기존 채팅 히스토리를 초기화하는 함수
const getOrCreateSessionId = () => {
  if (typeof window === 'undefined') return createSessionId()

  // 새로고침 시 기존 채팅 기록 제거
  Object.keys(sessionStorage).forEach((key) => {
    if (key.startsWith(CHAT_HISTORY_KEY_PREFIX)) {
      sessionStorage.removeItem(key)
    }
  })

  // 세션 ID 새로 발급
  const sessionId = createSessionId()
  sessionStorage.setItem(SESSION_KEY, sessionId)
  return sessionId
}

// 현재 시간을 ISO 문자열로 반환하는 함수
const nowIso = () => new Date().toISOString()

// URI 인코딩 실패 시 원문을 반환하는 안전 인코딩 함수
const safeEncodeUri = (value: string) => {
  try {
    return encodeURI(value)
  } catch {
    return value
  }
}

// HTML 특수문자를 이스케이프하는 함수
const escapeHtml = (text: string) =>
  String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

// 위험한 HTML/script/event/style/javascript 스킴을 제거하는 함수
const sanitizeHtml = (raw: string) =>
  raw
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/\son\w+='[^']*'/gi, '')
    .replace(/\sstyle=(["']).*?\1/gi, '')
    .replace(/javascript:/gi, '')

// 모델의 텍스트 응답을 렌더링 친화적으로 정규화하는 함수
const normalizeModelMarkdown = (raw: string) => {
  let text = String(raw || '')
    .replace(/\r\n/g, '\n')
    .replace(/\t/g, '  ')

  // HTML table 블록 분리
  text = text.replace(/(<table[\s\S]*?<\/table>)/gi, '\n$1\n')

  // 모델이 한 줄로 붙여 보낸 markdown table 복구
  text = text.replace(/\s\|\s\|/g, ' |\n|')

  // 붙어있는 리스트 복구
  text = text.replace(/([^\n])\s-\s(?=[\[\]가-힣A-Za-z0-9])/g, '$1\n- ')

  // 제목/구분선 주변 줄바꿈 정리
  text = text.replace(/(#{1,6}[^\n]+)\s-\s/g, '$1\n- ')
  text = text.replace(/\n{3,}/g, '\n\n')

  return text.trim()
}

// markdown table 구분선인지 판별하는 함수
const isMarkdownTableSeparatorLine = (line: string) =>
  /^\s*\|?(\s*:?-+:?\s*\|)+\s*:?-+:?\s*\|?\s*$/.test(line)

// markdown table 한 줄을 셀 배열로 분리하는 함수
const splitMarkdownTableCells = (line: string) =>
  line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim())

// 인라인 markdown(링크/코드/볼드/이탤릭)을 HTML로 변환하는 함수
const renderInlineMarkdown = (raw: string) => {
  let value = escapeHtml(raw)

  value = value.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
    (_match: string, label: string, url: string) => {
      const safeUrl = String(url).replace(/"/g, '&quot;')
      return `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)}</a>`
    },
  )

  value = value.replace(/`([^`]+)`/g, '<code>$1</code>')
  value = value.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  value = value.replace(/\*(.*?)\*/g, '<em>$1</em>')

  return value
}

// markdown table HTML을 생성하는 함수
const renderMarkdownTable = (headers: string[], rows: string[][]) => {
  const thead = `<thead><tr>${headers.map((h) => `<th>${renderInlineMarkdown(h)}</th>`).join('')}</tr></thead>`
  const tbody = `<tbody>${rows
    .map((row) => `<tr>${row.map((cell) => `<td>${renderInlineMarkdown(cell)}</td>`).join('')}</tr>`)
    .join('')}</tbody>`

  return `<div class="mdTableWrap"><table>${thead}${tbody}</table></div>`
}

// 모델 메시지 텍스트를 안전한 HTML 블록으로 변환하는 함수
const toMessageHtml = (text: string) => {
  const normalized = normalizeModelMarkdown(sanitizeHtml(String(text || '')))
  const lines = normalized.split('\n')
  const blocks: string[] = []
  let i = 0

  // 현재 라인이 독립 블록 시작인지 판별하는 함수
  const isBlockStart = (line: string, next: string) => {
    const trimmed = line.trim()
    if (!trimmed) return true
    if (/^```/.test(trimmed)) return true
    if (/^<table\b/i.test(trimmed)) return true
    if (trimmed.includes('|') && isMarkdownTableSeparatorLine(next)) return true
    if (/^#{1,6}\s+/.test(trimmed)) return true
    if (/^[-*]\s+/.test(trimmed)) return true
    if (/^---+$/.test(trimmed)) return true
    return false
  }

  while (i < lines.length) {
    const rawLine = lines[i]
    const line = rawLine.trim()

    if (!line) {
      i += 1
      continue
    }

    // fenced code block
    if (/^```/.test(line)) {
      const codeLines: string[] = []
      i += 1
      while (i < lines.length && !/^```/.test(lines[i].trim())) {
        codeLines.push(lines[i])
        i += 1
      }
      if (i < lines.length) i += 1
      blocks.push(`<pre><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`)
      continue
    }

    // html table block
    if (/^<table\b/i.test(line)) {
      let tableChunk = lines[i]
      while (i + 1 < lines.length && !/<\/table>/i.test(lines[i])) {
        i += 1
        tableChunk += `\n${lines[i]}`
      }
      blocks.push(`<div class="mdTableWrap">${sanitizeHtml(tableChunk)}</div>`)
      i += 1
      continue
    }

    // markdown table
    if (line.includes('|') && isMarkdownTableSeparatorLine(lines[i + 1] ?? '')) {
      const headers = splitMarkdownTableCells(line)
      i += 2
      const rows: string[][] = []

      while (i < lines.length) {
        const rowLine = lines[i].trim()
        if (!rowLine || !rowLine.includes('|')) break
        rows.push(splitMarkdownTableCells(rowLine))
        i += 1
      }

      blocks.push(renderMarkdownTable(headers, rows))
      continue
    }

    // heading
    const heading = line.match(/^(#{1,6})\s+(.*)$/)
    if (heading) {
      const level = heading[1].length
      blocks.push(`<h${level}>${renderInlineMarkdown(heading[2])}</h${level}>`)
      i += 1
      continue
    }

    // horizontal rule
    if (/^---+$/.test(line)) {
      blocks.push('<hr />')
      i += 1
      continue
    }

    // bullet list
    if (/^[-*]\s+/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*]\s+/, ''))
        i += 1
      }
      blocks.push(`<ul>${items.map((item) => `<li>${renderInlineMarkdown(item)}</li>`).join('')}</ul>`)
      continue
    }

    // 기타 html 라인
    if (/^<\/?[a-z][^>]*>/i.test(line)) {
      blocks.push(sanitizeHtml(rawLine))
      i += 1
      continue
    }

    // paragraph
    const paragraph: string[] = [line]
    i += 1

    while (i < lines.length) {
      const next = lines[i].trim()
      if (!next) {
        i += 1
        break
      }

      if (isBlockStart(lines[i], lines[i + 1] ?? '')) break

      paragraph.push(next)
      i += 1
    }

    blocks.push(`<p>${paragraph.map((p) => renderInlineMarkdown(p)).join('<br />')}</p>`)
  }

  return blocks.join('')
}

// 참고문헌 패널 상단 프리뷰 HTML 생성 함수
const toReferencePreviewHtml = (text?: string) => {
  if (!text) {
    return `<p>${escapeHtml(DEFAULT_REFERENCE_TEXT)}</p>`
  }

  const normalized = normalizeModelMarkdown(sanitizeHtml(text))
    .replace(/<table[\s\S]*?<\/table>/gi, '')
    .replace(/^\|.*\|$/gm, '')
    .replace(/^\s*\|?(\s*:?-+:?\s*\|)+\s*:?-+:?\s*\|?\s*$/gm, '')
    .replace(/\n{3,}/g, '\n\n')

  const lines = normalized
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  const blocks: string[] = []
  let i = 0
  const maxBlocks = 6 // 프리뷰 최대 블록 수

  while (i < lines.length && blocks.length < maxBlocks) {
    const line = lines[i]

    const heading = line.match(/^(#{1,6})\s+(.*)$/)
    if (heading) {
      blocks.push(`<h4>${renderInlineMarkdown(heading[2])}</h4>`)
      i += 1
      continue
    }

    if (/^[-*]\s+/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^[-*]\s+/.test(lines[i]) && items.length < 5) {
        items.push(lines[i].replace(/^[-*]\s+/, ''))
        i += 1
      }
      blocks.push(`<ul>${items.map((item) => `<li>${renderInlineMarkdown(item)}</li>`).join('')}</ul>`)
      continue
    }

    blocks.push(`<p>${renderInlineMarkdown(line)}</p>`)
    i += 1
  }

  if (i < lines.length) {
    blocks.push('<p class="ref_previewMore">... (요약)</p>')
  }

  return blocks.join('')
}

// API base URL을 계산하는 함수
const getBaseUrl = () => {
  const envBase = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || ''
  if (envBase) return envBase.replace(/\/+$/, '')
  if (typeof window !== 'undefined') return window.location.origin
  return ''
}

// 상대 경로를 절대 URL로 변환하는 함수
const toAbsoluteUrl = (raw: string) => {
  const value = String(raw || '').trim()
  if (!value) return ''

  if (/^(https?:)?\/\//i.test(value) || value.startsWith('data:') || value.startsWith('blob:')) {
    return value
  }

  const normalized = value.replace(/\\/g, '/')
  if (/^[a-zA-Z]:\//.test(normalized)) return ''

  const base = getBaseUrl()
  if (normalized.startsWith('/')) {
    return base ? `${base}${normalized}` : normalized
  }

  return base ? `${base}/${normalized.replace(/^\.?\//, '')}` : normalized
}

// reference_image 응답 데이터를 화면용 타입으로 정규화하는 함수
const normalizeReferenceImages = (raw: unknown): ReferenceImageType[] => {
  if (!Array.isArray(raw)) return []

  return raw
    .map((item, index) => {
      if (typeof item === 'string') {
        const url = safeEncodeUri(toAbsoluteUrl(item))
        return {
          url,
          title: `참고문헌 ${index + 1}`,
        }
      }

      if (item && typeof item === 'object') {
        const obj = item as Record<string, unknown>

        const base64 =
          (obj.base64 as string) ||
          (obj.image_base64 as string) ||
          (obj.file_base64 as string) ||
          ''

        const rawUrl =
          (obj.url as string) ||
          (obj.image_url as string) ||
          (obj.imageUrl as string) ||
          (obj.path as string) ||
          (obj.image_path as string) ||
          (obj.src as string) ||
          (obj.file_url as string) ||
          (base64 ? `data:image/png;base64,${base64}` : '')

        const title =
          (obj.title as string) ||
          (obj.name as string) ||
          (obj.filename as string) ||
          `참고문헌 ${index + 1}`

        const page =
          (obj.page as number | string) ??
          (obj.page_number as number | string) ??
          (obj.page_no as number | string)

        return {
          url: safeEncodeUri(toAbsoluteUrl(rawUrl)),
          title,
          name: (obj.name as string) || (obj.filename as string),
          page,
        }
      }

      return { url: '', title: `참고문헌 ${index + 1}` }
    })
    .filter((item) => item.url || item.title)
}

// 메시지 배열을 안전한 표준 메시지 타입으로 정규화하는 함수
const normalizeMessages = (messages: any[]): ChatMessageType[] =>
  messages.map((message, index) => ({
    id: message?.id ?? `msg_${Date.now()}_${index}`,
    speaker: (message?.speaker as SpeakerType) ?? 'bot',
    message: message?.message ?? '',
    timestamp: message?.timestamp ?? nowIso(),
    reference_image: normalizeReferenceImages(message?.reference_image),
    reference: Array.isArray(message?.reference) ? message.reference : [],
  }))

// sessionStorage에서 채팅 이력을 가져오는 함수
const getStoredMessages = (sessionId: string): ChatMessageType[] => {
  if (typeof window === 'undefined') return []
  const raw = sessionStorage.getItem(`${CHAT_HISTORY_KEY_PREFIX}${sessionId}`)
  if (!raw) return []
  try {
    return normalizeMessages(JSON.parse(raw))
  } catch {
    return []
  }
}

// sessionStorage에 채팅 이력을 저장하는 함수
const setStoredMessages = (sessionId: string, messages: ChatMessageType[]) => {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(`${CHAT_HISTORY_KEY_PREFIX}${sessionId}`, JSON.stringify(messages))
}

// 직접 백엔드 호출 URL을 반환하는 함수
const getApiUrl = () => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL
  if (!baseUrl) throw new Error('API URL not configured')
  return `${baseUrl}/python-api/rag/generate`
}

// 스트리밍 문자열 버퍼에서 JSON 객체들을 분리 파싱하는 함수
const parseStreamingJSON = (
  buffer: string,
): { objects: Record<string, unknown>[]; remaining: string } => {
  const objects: Record<string, unknown>[] = []
  let remaining = buffer.replace(/\}\s*\{/g, '}\n{')
  let startIdx = 0

  while (startIdx < remaining.length) {
    const firstBrace = remaining.indexOf('{', startIdx)
    if (firstBrace === -1) {
      remaining = remaining.slice(startIdx).trim()
      break
    }

    let braceCount = 0
    let inString = false
    let escapeNext = false
    let endIdx = -1

    for (let i = firstBrace; i < remaining.length; i += 1) {
      const char = remaining[i]

      if (escapeNext) {
        escapeNext = false
        continue
      }

      if (char === '\\') {
        escapeNext = true
        continue
      }

      if (char === '"') {
        inString = !inString
        continue
      }

      if (!inString) {
        if (char === '{') braceCount += 1
        if (char === '}') braceCount -= 1
        if (braceCount === 0) {
          endIdx = i
          break
        }
      }
    }

    if (endIdx !== -1) {
      const jsonStr = remaining.slice(firstBrace, endIdx + 1)
      try {
        objects.push(JSON.parse(jsonStr))
        startIdx = endIdx + 1
      } catch {
        startIdx = firstBrace + 1
      }
    } else {
      remaining = remaining.slice(firstBrace)
      break
    }
  }

  return { objects, remaining }
}

// direct API 우선 호출 후 실패 시 /api/chat로 폴백하는 함수
const smartFetch = async (body: Record<string, unknown>) => {
  const options: RequestInit = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }

  try {
    const directUrl = getApiUrl()
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    try {
      const response = await fetch(directUrl, { ...options, signal: controller.signal })
      clearTimeout(timeoutId)
      if (response.ok) return response
      throw new Error(`Direct connection failed: ${response.status}`)
    } catch (directError: any) {
      clearTimeout(timeoutId)
      const proxyResponse = await fetch('/api/chat', options)
      if (proxyResponse.ok) return proxyResponse
      throw new Error(
        `Both direct/proxy failed. Direct: ${directError?.message ?? 'unknown'}, Proxy: ${proxyResponse.status}`,
      )
    }
  } catch {
    const proxyResponse = await fetch('/api/chat', options)
    if (proxyResponse.ok) return proxyResponse
    throw new Error(`Proxy connection failed: ${proxyResponse.status}`)
  }
}

// 채팅 메시지를 전송하고 스트리밍 응답을 반영해 이력을 저장하는 함수
const addChatMessage = async (
  content: string,
  sessionId: string,
  onStream?: (partial: string) => void,
): Promise<ChatApiResponseType> => {
  try {
    const history = getStoredMessages(sessionId)

    const userMessage: ChatMessageType = {
      id: `user_${Date.now()}`,
      speaker: 'user',
      message: content,
      timestamp: nowIso(),
    }

    const nextHistory = [...history, userMessage].slice(-20)

    const requestBody = {
      question: content,
      stream: true,
      messages: nextHistory.map((message) => ({
        speaker: message.speaker,
        message: message.message,
      })),
      limit: 20,
      session_id: sessionId,
    }

    const response = await smartFetch(requestBody)

    let lastAssistant = ''
    let referenceImages: ReferenceImageType[] = []
    let lastReference: unknown[] = []

    if (response.body) {
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let done = false
      let buffer = ''
      let lastUpdateTime = Date.now()

      while (!done) {
        const { value, done: doneReading } = await reader.read()
        done = doneReading

        if (value) {
          const chunk = decoder.decode(value, { stream: !done })
          buffer += chunk

          const { objects, remaining } = parseStreamingJSON(buffer)
          buffer = remaining

          for (const data of objects) {
            if (typeof data.assistant === 'string') {
              lastAssistant = data.assistant
            }

            if (Array.isArray(data.reference_image)) {
              referenceImages = normalizeReferenceImages(data.reference_image)
            }

            if (Array.isArray(data.reference)) {
              lastReference = data.reference
            }

            const now = Date.now()
            const shouldUpdate = now - lastUpdateTime > 30 || done || lastAssistant.length % 50 === 0

            if (onStream && shouldUpdate) {
              onStream(lastAssistant)
              lastUpdateTime = now
            }
          }
        }
      }

      if (onStream) onStream(lastAssistant)
    } else {
      const data = await response.json()
      lastAssistant = data?.assistant ?? ''
      referenceImages = normalizeReferenceImages(data?.reference_image)
      lastReference = Array.isArray(data?.reference) ? data.reference : []
      if (onStream) onStream(lastAssistant)
    }

    const botMessage: ChatMessageType = {
      id: `bot_${Date.now()}`,
      speaker: 'bot',
      message: lastAssistant,
      timestamp: nowIso(),
      reference_image: referenceImages,
      reference: lastReference,
    }

    const finalMessages = [...nextHistory, botMessage].slice(-20)
    setStoredMessages(sessionId, finalMessages)

    return {
      success: true,
      data: finalMessages,
      message: 'Message sent and AI response received',
      timestamp: nowIso(),
    }
  } catch (error: any) {
    return {
      success: false,
      data: [],
      message: error?.message ?? 'Failed to send message',
      timestamp: nowIso(),
    }
  }
}

// 메시지 목록에서 최신 참고문헌 포함 bot 메시지를 반환하는 함수
const getLatestReferenceMessage = (messages: ChatMessageType[]) =>
  [...messages].reverse().find((message) => message.speaker === 'bot' && (message.reference_image?.length ?? 0) > 0) ?? null

export default function ChatbotPage() {
  /******************** 변수 영역 ********************/
  const [sessionId] = useState(() => getOrCreateSessionId()) // 현재 채팅 세션 ID
  const [messages, setMessages] = useState<ChatMessageType[]>([]) // 채팅 메시지 배열
  const [chatInput, setChatInput] = useState('') // 입력창 문자열
  const [isLoading, setIsLoading] = useState(false) // 전송/응답 로딩 상태
  const [error, setError] = useState<string | null>(null) // 에러 메시지

  const [activeReferenceMessageId, setActiveReferenceMessageId] = useState<string | null>(null) // 활성 참고문헌 메시지 ID
  const [isReferencePanelOpen, setIsReferencePanelOpen] = useState(false) // 참고문헌 패널 열림 여부
  const [currentImageIndex, setCurrentImageIndex] = useState(0) // 참고문헌 이미지 인덱스
  const [zoomLevel, setZoomLevel] = useState(1) // 참고문헌 이미지 확대 비율
  const [isReferenceImageError, setIsReferenceImageError] = useState(false) // 참고문헌 이미지 로드 실패 여부

  const messagesEndRef = useRef<HTMLDivElement>(null) // 메시지 목록 맨 아래 스크롤용 ref

  const lastMessageContent = messages.length > 0 ? messages[messages.length - 1].message : '' // 마지막 메시지 내용(스크롤 트리거)
  const latestReferenceMessage = useMemo(() => getLatestReferenceMessage(messages), [messages]) // 최신 참고문헌 메시지

  const activeReferenceMessage = useMemo(() => {
    // 현재 선택된 참고문헌 메시지 계산
    if (!activeReferenceMessageId) return latestReferenceMessage
    return messages.find((message) => message.id === activeReferenceMessageId) ?? latestReferenceMessage
  }, [activeReferenceMessageId, latestReferenceMessage, messages])

  const activeReferences = activeReferenceMessage?.reference_image ?? [] // 활성 참고문헌 이미지 목록
  const currentReference = activeReferences[currentImageIndex] // 현재 표시 중인 참고문헌 이미지

  /******************** 함수 영역 ********************/
  // 참고문헌 패널을 선택한 메시지 기준으로 오픈하는 함수
  const handleReferenceOpen = useCallback((message: ChatMessageType) => {
    if (!message.reference_image || message.reference_image.length === 0) return
    setActiveReferenceMessageId(message.id)
    setCurrentImageIndex(0)
    setZoomLevel(1)
    setIsReferenceImageError(false)
    setIsReferencePanelOpen(true)
  }, [])

  // 참고문헌 패널을 닫는 함수
  const handleReferenceClose = () => {
    setIsReferencePanelOpen(false)
  }

  // 채팅 메시지 전송(optimistic UI + 스트리밍 반영) 함수
  const handleSendMessage = useCallback(async () => {
    const trimmed = chatInput.trim()
    if (!trimmed || isLoading) return

    setError(null)
    setChatInput('')
    setIsLoading(true)

    const tempUserId = `temp_user_${Date.now()}`
    const tempBotId = `temp_bot_${Date.now()}`

    const optimisticUser: ChatMessageType = {
      id: tempUserId,
      speaker: 'user',
      message: trimmed,
      timestamp: nowIso(),
    }

    const optimisticBot: ChatMessageType = {
      id: tempBotId,
      speaker: 'bot',
      message: '',
      timestamp: nowIso(),
    }

    setMessages((prev) => [...prev, optimisticUser, optimisticBot])

    const response = await addChatMessage(trimmed, sessionId, (partial) => {
      setMessages((prev) =>
        prev.map((message) => (message.id === tempBotId ? { ...message, message: partial } : message)),
      )
    })

    if (response.success) {
      const normalized = normalizeMessages(response.data)
      setMessages(normalized)
      const latest = getLatestReferenceMessage(normalized)
      if (latest && !activeReferenceMessageId) setActiveReferenceMessageId(latest.id)
    } else {
      setMessages((prev) => prev.filter((message) => message.id !== tempUserId && message.id !== tempBotId))
      setError(response.message ?? '메시지 전송 중 오류가 발생했습니다.')
    }

    setIsLoading(false)
  }, [chatInput, isLoading, sessionId, activeReferenceMessageId])

  // Enter 키 입력 시 메시지를 전송하는 함수
  const handleEnterSend = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSendMessage()
    }
  }

  // 참고문헌 이미지 이전 페이지로 이동하는 함수
  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => Math.max(0, prev - 1))
  }

  // 참고문헌 이미지 다음 페이지로 이동하는 함수
  const handleNextImage = () => {
    setCurrentImageIndex((prev) => Math.min(activeReferences.length - 1, prev + 1))
  }

  // 참고문헌 이미지 축소 함수
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(1, prev / 1.2))

  // 참고문헌 이미지 확대 함수
  const handleZoomIn = () => setZoomLevel((prev) => Math.min(5, prev * 1.2))

  /******************** 수행 영역 ********************/
  useEffect(() => {
    // 최초 렌더 시 세션에 저장된 메시지 복원
    setMessages(getStoredMessages(sessionId))
  }, [sessionId])

  useEffect(() => {
    // 메시지 수/내용 변화 시 메시지 목록 최하단으로 자동 스크롤
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }, [messages.length, lastMessageContent])

  useEffect(() => {
    // 참고문헌 메시지가 존재하고 활성 메시지가 없으면 최신 참고문헌 메시지로 지정
    if (!activeReferenceMessageId && latestReferenceMessage) {
      setActiveReferenceMessageId(latestReferenceMessage.id)
    }
  }, [activeReferenceMessageId, latestReferenceMessage])

  useEffect(() => {
    // 참고문헌 목록 길이에 맞게 인덱스/줌/에러 상태 보정
    if (!activeReferences.length) {
      setCurrentImageIndex(0)
      setZoomLevel(1)
      setIsReferenceImageError(false)
      return
    }
    if (currentImageIndex >= activeReferences.length) {
      setCurrentImageIndex(0)
    }
  }, [activeReferences.length, currentImageIndex])

  useEffect(() => {
    // 메시지/이미지 전환 시 이미지 에러 상태 초기화
    setIsReferenceImageError(false)
  }, [activeReferenceMessage?.id, currentImageIndex, currentReference?.url])

  return (
    <div className={cbc.chatbot_root}>
      <header className={cbc.chatbot_pageHead}>
        <h1>통합 AI 챗봇</h1>
        <p>케이와이 통합 AI 챗봇 입니다. 무엇이든 물어보세요.</p>
      </header>

      <section className={`${cbc.chatbot_frame} ${isReferencePanelOpen ? cbc.chatbot_frameWithRef : ''}`}>
        <article className={cbc.chat_panel}>
          <div className={cbc.chat_head}>
            <h2>AI Chat</h2>
            <p>케이와이 AI Aent Chatbot 입니다.</p>
          </div>

          <p className={cbc.chat_subTitle}>궁금하신 사항을 질의해주세요.</p>
          <div className={cbc.chat_divider} />

          {error && <div className={cbc.chat_error}>{error}</div>}

          <div className={cbc.chat_messagesViewport}>
            <div className={cbc.chat_messages}>
              {messages.map((message) => {
                if (message.speaker === 'user') {
                  return (
                    <div key={message.id} className={cbc.chat_rowUser}>
                      <div className={cbc.chat_userBubble}>{message.message}</div>
                    </div>
                  )
                }

                if (!message.message.trim()) return null

                const hasReference = (message.reference_image?.length ?? 0) > 0

                return (
                  <div key={message.id} className={cbc.chat_rowBot}>
                    <div className={cbc.chat_botAvatar}>
                      <i className={imag.ai_assistant_icon} aria-hidden="true" />
                    </div>

                    <div className={cbc.chat_botContent}>
                      <div
                        className={cbc.chat_botBubble}
                        dangerouslySetInnerHTML={{ __html: toMessageHtml(message.message) }}
                      />

                      {hasReference && (
                        <button
                          type="button"
                          className={`${cbc.chat_referenceBtn} ${
                            isReferencePanelOpen && activeReferenceMessage?.id === message.id
                              ? cbc.chat_referenceBtnActive
                              : ''
                          }`}
                          onClick={() => handleReferenceOpen(message)}
                        >
                          참고문헌보기
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}

              {isLoading && (
                <div className={cbc.chat_rowBot}>
                  <div className={cbc.chat_botAvatar}>
                    <i className={imag.ai_assistant_icon} aria-hidden="true" />
                  </div>
                  <div className={cbc.chat_typing}>
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          <div className={cbc.chat_inputWrap}>
            <input
              type="text"
              className={cbc.chat_input}
              placeholder="질의를 입력해주세요."
              value={chatInput}
              onChange={(event) => setChatInput(event.target.value)}
              onKeyDown={handleEnterSend}
              disabled={isLoading}
            />
            <button
              type="button"
              className={cbc.chat_sendBtn}
              onClick={handleSendMessage}
              disabled={!chatInput.trim() || isLoading}
              aria-label="전송"
            >
              <i className={imag.send_message_icon} aria-hidden="true" />
            </button>
          </div>
        </article>

        {isReferencePanelOpen && (
          <aside className={cbc.ref_panel}>
            <div className={cbc.ref_head}>
              <div className={cbc.ref_headLeft}>
                <h3>참고 문헌</h3>
                <p>아래 답변에 대한 참고 문헌 입니다.</p>
              </div>
              <button
                type="button"
                className={cbc.ref_closeBtn}
                onClick={handleReferenceClose}
                aria-label="참고문헌 닫기"
              >
                ✕
              </button>
            </div>

            <div
              className={cbc.ref_summary}
              dangerouslySetInnerHTML={{ __html: toReferencePreviewHtml(activeReferenceMessage?.message) }}
            />

            <div className={cbc.ref_viewer}>
              <div className={cbc.ref_nav}>
                <button
                  type="button"
                  className={cbc.ref_navBtn}
                  onClick={handlePrevImage}
                  disabled={currentImageIndex === 0 || !activeReferences.length}
                  aria-label="이전 문서"
                >
                  &lt;
                </button>

                <div className={cbc.ref_navCenter}>
                  <button
                    type="button"
                    className={cbc.ref_zoomBtn}
                    onClick={handleZoomOut}
                    disabled={!activeReferences.length}
                  >
                    -
                  </button>
                  <button
                    type="button"
                    className={cbc.ref_zoomBtn}
                    onClick={handleZoomIn}
                    disabled={!activeReferences.length}
                  >
                    +
                  </button>
                  <input
                    type="number"
                    className={cbc.ref_pageInput}
                    value={activeReferences.length ? currentImageIndex + 1 : 0}
                    min={1}
                    max={Math.max(activeReferences.length, 1)}
                    onChange={(event) => {
                      const nextIndex = Number(event.target.value) - 1
                      if (
                        !Number.isNaN(nextIndex) &&
                        nextIndex >= 0 &&
                        nextIndex < activeReferences.length
                      ) {
                        setCurrentImageIndex(nextIndex)
                      }
                    }}
                    disabled={!activeReferences.length}
                  />
                  <span className={cbc.ref_pageCount}>의 {activeReferences.length || 0}</span>
                </div>

                <button
                  type="button"
                  className={cbc.ref_navBtn}
                  onClick={handleNextImage}
                  disabled={!activeReferences.length || currentImageIndex >= activeReferences.length - 1}
                  aria-label="다음 문서"
                >
                  &gt;
                </button>
              </div>

              {currentReference && (
                <div className={cbc.ref_docMeta}>
                  <span>{currentReference.title || currentReference.name || '참고문헌'}</span>
                  <span>{currentReference.page ? `page:${currentReference.page}` : ''}</span>
                </div>
              )}

              <div className={cbc.ref_imageViewport}>
                {currentReference ? (
                  currentReference.url && !isReferenceImageError ? (
                    <img
                      src={currentReference.url}
                      alt={currentReference.title ?? 'Reference document'}
                      className={cbc.ref_documentImage}
                      style={{ transform: `scale(${zoomLevel})` }}
                      draggable={false}
                      onError={() => setIsReferenceImageError(true)}
                    />
                  ) : (
                    <div className={cbc.ref_empty}>
                      <div className={cbc.ref_emptyTitle}>참고문헌 이미지를 불러오지 못했습니다.</div>
                      <div className={cbc.ref_emptyMeta}>
                        {currentReference.title || currentReference.name || '제목 없음'}
                        {currentReference.page ? ` / page:${currentReference.page}` : ''}
                      </div>
                      <code className={cbc.ref_emptyUrl}>{currentReference.url || 'url 없음'}</code>
                    </div>
                  )
                ) : (
                  <div className={cbc.ref_empty}>참고 문헌이 없습니다.</div>
                )}
              </div>
            </div>
          </aside>
        )}
      </section>
    </div>
  )
}
