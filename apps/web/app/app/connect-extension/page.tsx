"use client"

import { useAuth } from "@clerk/nextjs"
import { rememberExtensionId } from "@/lib/focus/extension-bridge"
import { useEffect, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import { useTranslation } from "react-i18next"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"

type Status = "connecting" | "success" | "error" | "no-extension"

export default function ConnectExtensionPage() {
  const { getToken, isLoaded, isSignedIn } = useAuth()
  const { t } = useTranslation()
  const searchParams = useSearchParams()
  const extId = searchParams.get("ext_id")
  const [status, setStatus] = useState<Status>("connecting")
  const [errorMsg, setErrorMsg] = useState("")
  const ran = useRef(false)

  useEffect(() => {
    if (!isLoaded || !isSignedIn || ran.current) return
    if (!extId) {
      setStatus("no-extension")
      return
    }

    const extensionId: string = extId
    ran.current = true

    async function connect() {
      try {
        const jwt = await getToken()
        const res = await fetch(`${API_URL}/api/auth/extension-tokens`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${jwt}`,
          },
          body: JSON.stringify({ name: "Chrome Extension" }),
        })
        if (!res.ok) throw new Error(`API error ${res.status}`)
        const { data } = await res.json()

        const chromeApi = (
          window as Window & {
            chrome?: {
              runtime?: {
                lastError?: { message?: string }
                sendMessage?: (
                  extensionId: string,
                  message: unknown,
                  callback: (response?: { ok?: boolean }) => void
                ) => void
              }
            }
          }
        ).chrome

        if (!chromeApi?.runtime?.sendMessage) {
          setStatus("no-extension")
          return
        }

        chromeApi.runtime.sendMessage(
          extensionId,
          { type: "lockin-auth", token: data.token, apiUrl: API_URL },
          (response) => {
            if (chromeApi.runtime?.lastError || !response?.ok) {
              setErrorMsg(
                chromeApi.runtime?.lastError?.message ??
                  t("app.connectExtension.didNotRespond")
              )
              setStatus("error")
            } else {
              rememberExtensionId(extensionId)
              setStatus("success")
              setTimeout(() => window.close(), 2000)
            }
          }
        )
      } catch (err: unknown) {
        setErrorMsg(err instanceof Error ? err.message : String(err))
        setStatus("error")
      }
    }

    void connect()
  }, [isLoaded, isSignedIn, extId, getToken, t])

  if (!isLoaded) return null

  if (!isSignedIn) {
    return (
      <div style={wrapStyle}>
        <div style={cardStyle}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>LockIn</div>
          <h2 style={titleStyle}>{t("app.connectExtension.signInTitle")}</h2>
          <p style={subStyle}>
            {t("app.connectExtension.signInDescription")}
          </p>
          <a href="/app/sign-in" style={btnStyle}>
            {t("app.connectExtension.signInButton")}
          </a>
        </div>
      </div>
    )
  }

  return (
    <div style={wrapStyle}>
      <div style={cardStyle}>
        {status === "connecting" && (
          <>
            <div style={{ fontSize: 32, marginBottom: 12 }}>...</div>
            <h2 style={titleStyle}>
              {t("app.connectExtension.connectingTitle")}
            </h2>
            <p style={subStyle}>
              {t("app.connectExtension.connectingDescription")}
            </p>
          </>
        )}
        {status === "success" && (
          <>
            <div style={{ fontSize: 32, marginBottom: 12 }}>OK</div>
            <h2 style={{ ...titleStyle, color: "#34c759" }}>
              {t("app.connectExtension.successTitle")}
            </h2>
            <p style={subStyle}>
              {t("app.connectExtension.successDescription")}
            </p>
          </>
        )}
        {status === "error" && (
          <>
            <div style={{ fontSize: 32, marginBottom: 12 }}>!</div>
            <h2 style={{ ...titleStyle, color: "#ff3b5c" }}>
              {t("app.connectExtension.errorTitle")}
            </h2>
            <p style={subStyle}>{errorMsg}</p>
            <p style={{ ...subStyle, marginTop: 8 }}>
              {t("app.connectExtension.errorHint")}
            </p>
          </>
        )}
        {status === "no-extension" && (
          <>
            <div style={{ fontSize: 32, marginBottom: 12 }}>!</div>
            <h2 style={titleStyle}>
              {t("app.connectExtension.noExtensionTitle")}
            </h2>
            <p style={subStyle}>
              {!extId
                ? t("app.connectExtension.openFromExtension")
                : t("app.connectExtension.noResponse")}
            </p>
          </>
        )}
      </div>
    </div>
  )
}

const wrapStyle: React.CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#fbfaf5",
  fontFamily: "sans-serif",
}
const cardStyle: React.CSSProperties = {
  textAlign: "center",
  padding: "48px 40px",
  maxWidth: 400,
  width: "100%",
  border: "2px solid #1f1f1f",
  borderRadius: "14px 11px 13px 9px / 10px 14px 9px 13px",
  background: "white",
}
const titleStyle: React.CSSProperties = {
  fontSize: 24,
  fontWeight: 700,
  marginBottom: 8,
}
const subStyle: React.CSSProperties = {
  fontSize: 14,
  color: "#7a7a7a",
  lineHeight: 1.5,
}
const btnStyle: React.CSSProperties = {
  display: "inline-block",
  marginTop: 16,
  padding: "10px 24px",
  background: "#ff3b5c",
  color: "white",
  borderRadius: 8,
  fontWeight: 700,
  fontSize: 14,
  textDecoration: "none",
}
