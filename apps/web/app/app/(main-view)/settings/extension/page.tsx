"use client"

import { useAuth } from "@clerk/nextjs"
import type { AppLocale } from "@workspace/i18n"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"

type Token = {
  id: string
  name: string
  createdAt: string
  lastUsedAt: string | null
}

export default function ExtensionSettingsPage() {
  const { getToken } = useAuth()
  const { i18n, t } = useTranslation()
  const currentLocale = i18n.language as AppLocale
  const dateLocale = currentLocale === "vi" ? "vi-VN" : "en-US"
  const [tokens, setTokens] = useState<Token[]>([])
  const [newToken, setNewToken] = useState<string | null>(null)
  const [newTokenName, setNewTokenName] = useState("")
  const [loading, setLoading] = useState(true)

  async function fetchTokens() {
    const jwt = await getToken()
    const res = await fetch(`${API_URL}/api/auth/extension-tokens`, {
      headers: { Authorization: `Bearer ${jwt}` },
    })

    if (res.ok) {
      const { data } = await res.json()
      setTokens(data)
    }

    setLoading(false)
  }

  useEffect(() => {
    void fetchTokens()
  }, [])

  async function createToken() {
    const name = newTokenName.trim() || "Chrome Extension"
    const jwt = await getToken()
    const res = await fetch(`${API_URL}/api/auth/extension-tokens`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwt}`,
      },
      body: JSON.stringify({ name }),
    })

    if (res.ok) {
      const { data } = await res.json()
      setNewToken(data.token)
      setNewTokenName("")
      void fetchTokens()
    }
  }

  async function revokeToken(id: string) {
    if (!confirm(t("app.extensionSettings.revokeConfirm"))) return

    const jwt = await getToken()
    await fetch(`${API_URL}/api/auth/extension-tokens/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${jwt}` },
    })
    setTokens((current) => current.filter((token) => token.id !== id))
    if (newToken) setNewToken(null)
  }

  return (
    <div style={wrapStyle}>
      <h1 style={headStyle}>{t("app.extensionSettings.title")}</h1>
      <p style={subStyle}>{t("app.extensionSettings.description")}</p>

      {newToken && (
        <div style={alertStyle}>
          <p style={{ fontWeight: 700, marginBottom: 6 }}>
            {t("app.extensionSettings.newTokenWarning")}
          </p>
          <code style={codeStyle}>{newToken}</code>
          <button
            style={copyBtnStyle}
            onClick={() => navigator.clipboard.writeText(newToken)}
          >
            {t("app.extensionSettings.copy")}
          </button>
        </div>
      )}

      <div style={sectionStyle}>
        <h2 style={sectionHeadStyle}>
          {t("app.extensionSettings.createTitle")}
        </h2>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            style={inputStyle}
            placeholder={t("app.extensionSettings.namePlaceholder")}
            value={newTokenName}
            onChange={(event) => setNewTokenName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") void createToken()
            }}
          />
          <button style={btnStyle} onClick={() => void createToken()}>
            {t("app.extensionSettings.create")}
          </button>
        </div>
      </div>

      <div style={sectionStyle}>
        <h2 style={sectionHeadStyle}>
          {t("app.extensionSettings.existingTitle")}
        </h2>
        {loading && (
          <p style={subStyle}>{t("app.extensionSettings.loading")}</p>
        )}
        {!loading && tokens.length === 0 && (
          <p style={subStyle}>{t("app.extensionSettings.empty")}</p>
        )}
        {tokens.map((token) => (
          <div key={token.id} style={rowStyle}>
            <div>
              <div style={{ fontWeight: 600 }}>{token.name}</div>
              <div style={metaStyle}>
                {t("app.extensionSettings.created")}:{" "}
                {new Date(token.createdAt).toLocaleDateString(dateLocale)}
                {token.lastUsedAt &&
                  ` · ${t("app.extensionSettings.lastUsed")}: ${new Date(
                    token.lastUsedAt
                  ).toLocaleDateString(dateLocale)}`}
              </div>
            </div>
            <button
              style={revokeBtnStyle}
              onClick={() => void revokeToken(token.id)}
            >
              {t("app.extensionSettings.revoke")}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

const wrapStyle: React.CSSProperties = {
  maxWidth: 600,
  margin: "0 auto",
  padding: "40px 24px",
}
const headStyle: React.CSSProperties = {
  fontSize: 24,
  fontWeight: 700,
  marginBottom: 8,
}
const subStyle: React.CSSProperties = {
  fontSize: 14,
  color: "#7a7a7a",
  marginBottom: 24,
}
const sectionStyle: React.CSSProperties = { marginBottom: 32 }
const sectionHeadStyle: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 600,
  marginBottom: 12,
}
const alertStyle: React.CSSProperties = {
  background: "#fff9e6",
  border: "2px solid #ff9500",
  borderRadius: 10,
  padding: "16px 20px",
  marginBottom: 24,
  fontSize: 14,
}
const codeStyle: React.CSSProperties = {
  display: "block",
  background: "#f3f1e8",
  padding: "8px 12px",
  borderRadius: 6,
  fontSize: 12,
  wordBreak: "break-all",
  margin: "8px 0",
}
const copyBtnStyle: React.CSSProperties = {
  padding: "4px 12px",
  border: "1.5px solid #1f1f1f",
  borderRadius: 6,
  background: "white",
  cursor: "pointer",
  fontSize: 12,
  fontWeight: 600,
}
const inputStyle: React.CSSProperties = {
  flex: 1,
  padding: "8px 12px",
  border: "2px solid #1f1f1f",
  borderRadius: "10px 8px 12px 7px",
  fontSize: 14,
  background: "#fbfaf5",
  outline: "none",
}
const btnStyle: React.CSSProperties = {
  padding: "8px 18px",
  background: "#ff3b5c",
  color: "white",
  border: "none",
  borderRadius: 8,
  fontWeight: 700,
  fontSize: 14,
  cursor: "pointer",
}
const rowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "12px 0",
  borderBottom: "1.5px dashed rgba(0,0,0,.12)",
}
const metaStyle: React.CSSProperties = {
  fontSize: 12,
  color: "#7a7a7a",
  marginTop: 2,
}
const revokeBtnStyle: React.CSSProperties = {
  padding: "4px 12px",
  border: "1.5px solid #ff3b5c",
  borderRadius: 6,
  background: "white",
  color: "#ff3b5c",
  cursor: "pointer",
  fontSize: 12,
  fontWeight: 600,
}
