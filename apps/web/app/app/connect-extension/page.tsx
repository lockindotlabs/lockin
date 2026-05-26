'use client'

import { useAuth } from '@clerk/nextjs'
import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

type Status = 'connecting' | 'success' | 'error' | 'no-extension'

export default function ConnectExtensionPage() {
  const { getToken, isLoaded, isSignedIn } = useAuth()
  const searchParams = useSearchParams()
  const extId = searchParams.get('ext_id')
  const [status, setStatus] = useState<Status>('connecting')
  const [errorMsg, setErrorMsg] = useState('')
  const ran = useRef(false)

  useEffect(() => {
    if (!isLoaded || !isSignedIn || ran.current) return
    if (!extId) { setStatus('no-extension'); return }
    ran.current = true

    async function connect() {
      try {
        const jwt = await getToken()
        const res = await fetch(`${API_URL}/api/auth/extension-tokens`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` },
          body: JSON.stringify({ name: 'Chrome Extension' }),
        })
        if (!res.ok) throw new Error(`API error ${res.status}`)
        const { data } = await res.json()

        const chromeApi = (window as any).chrome
        if (!chromeApi?.runtime?.sendMessage) {
          setStatus('no-extension')
          return
        }
        chromeApi.runtime.sendMessage(
          extId,
          { type: 'lockin-auth', token: data.token, apiUrl: API_URL },
          (response: any) => {
            if (chromeApi.runtime.lastError || !response?.ok) {
              setErrorMsg(chromeApi.runtime.lastError?.message ?? 'Extension did not respond')
              setStatus('error')
            } else {
              setStatus('success')
              setTimeout(() => window.close(), 2000)
            }
          },
        )
      } catch (err: any) {
        setErrorMsg(err.message)
        setStatus('error')
      }
    }

    connect()
  }, [isLoaded, isSignedIn, extId, getToken])

  if (!isLoaded) return null

  if (!isSignedIn) {
    return (
      <div style={wrapStyle}>
        <div style={cardStyle}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🔒</div>
          <h2 style={titleStyle}>Cần đăng nhập</h2>
          <p style={subStyle}>Bạn cần đăng nhập để kết nối extension.</p>
          <a href="/app/sign-in" style={btnStyle}>Đăng nhập →</a>
        </div>
      </div>
    )
  }

  return (
    <div style={wrapStyle}>
      <div style={cardStyle}>
        {status === 'connecting' && (
          <>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⇄</div>
            <h2 style={titleStyle}>Đang kết nối…</h2>
            <p style={subStyle}>Đang tạo token và gửi đến extension.</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div style={{ fontSize: 32, marginBottom: 12 }}>✓</div>
            <h2 style={{ ...titleStyle, color: '#34c759' }}>Kết nối thành công!</h2>
            <p style={subStyle}>Extension đã được liên kết. Tab này sẽ tự đóng.</p>
          </>
        )}
        {status === 'error' && (
          <>
            <div style={{ fontSize: 32, marginBottom: 12 }}>✗</div>
            <h2 style={{ ...titleStyle, color: '#ff3b5c' }}>Kết nối thất bại</h2>
            <p style={subStyle}>{errorMsg}</p>
            <p style={{ ...subStyle, marginTop: 8 }}>
              Hãy đảm bảo extension LockIn đã được cài và bật, rồi thử lại.
            </p>
          </>
        )}
        {status === 'no-extension' && (
          <>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⚠</div>
            <h2 style={titleStyle}>Không tìm thấy extension</h2>
            <p style={subStyle}>
              {!extId
                ? 'Hãy mở trang này từ cài đặt extension, không phải truy cập trực tiếp.'
                : 'Extension không phản hồi. Hãy cài đặt và reload từ chrome://extensions.'}
            </p>
          </>
        )}
      </div>
    </div>
  )
}

const wrapStyle: React.CSSProperties = {
  minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: '#fbfaf5', fontFamily: 'sans-serif',
}
const cardStyle: React.CSSProperties = {
  textAlign: 'center', padding: '48px 40px', maxWidth: 400, width: '100%',
  border: '2px solid #1f1f1f', borderRadius: '14px 11px 13px 9px / 10px 14px 9px 13px',
  background: 'white',
}
const titleStyle: React.CSSProperties = { fontSize: 24, fontWeight: 700, marginBottom: 8 }
const subStyle: React.CSSProperties = { fontSize: 14, color: '#7a7a7a', lineHeight: 1.5 }
const btnStyle: React.CSSProperties = {
  display: 'inline-block', marginTop: 16, padding: '10px 24px',
  background: '#ff3b5c', color: 'white', borderRadius: 8,
  fontWeight: 700, fontSize: 14, textDecoration: 'none',
}
