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
  return requiredEnv("PUBLIC_WEB_URL").replace(/\/$/, "")
}
