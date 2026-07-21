import { PayOS } from "@payos/node"

let client: PayOS | null = null

function requiredEnv(name: string) {
  const value = process.env[name]

  if (!value) {
    throw new Error(`${name} is not configured`)
  }

  return value
}

export function getPayOSClient() {
  if (!client) {
    client = new PayOS({
      clientId: requiredEnv("PAYOS_CLIENT_ID"),
      apiKey: requiredEnv("PAYOS_API_KEY"),
      checksumKey: requiredEnv("PAYOS_CHECKSUM_KEY"),
    })
  }

  return client
}

export function getPublicWebUrl() {
  const configuredUrl =
    process.env["PUBLIC_WEB_URL"] ??
    process.env["NEXT_PUBLIC_WEB_URL"] ??
    process.env["NEXT_PUBLIC_APP_URL"] ??
    process.env["NEXT_PUBLIC_SITE_URL"]

  return configuredUrl?.replace(/\/$/, "") ?? null
}

export function resolvePublicWebUrl(request: Request) {
  const configuredUrl = getPublicWebUrl()

  if (configuredUrl) {
    return configuredUrl
  }

  const origin = request.headers.get("origin")

  if (origin) {
    return origin.replace(/\/$/, "")
  }

  const forwardedProto = request.headers.get("x-forwarded-proto")
  const forwardedHost = request.headers.get("x-forwarded-host")

  if (forwardedProto && forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`.replace(/\/$/, "")
  }

  const host = request.headers.get("host")

  if (host) {
    const protocol =
      host.includes("localhost") || host.startsWith("127.0.0.1")
        ? "http"
        : "https"

    return `${protocol}://${host}`.replace(/\/$/, "")
  }

  throw new Error(
    "PUBLIC_WEB_URL is not configured and the request origin could not be inferred"
  )
}
