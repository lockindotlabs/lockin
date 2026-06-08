"use client"

import * as React from "react"

export function useAdminAccess() {
  const [isAdmin, setIsAdmin] = React.useState(false)
  const [isLoaded, setIsLoaded] = React.useState(false)

  React.useEffect(() => {
    let active = true

    void fetch("/api/admin/me", { cache: "no-store" })
      .then(async (response) => {
        if (!active) {
          return
        }

        if (!response.ok) {
          setIsAdmin(false)
          return
        }

        const data = (await response.json()) as { isAdmin?: boolean }
        setIsAdmin(Boolean(data.isAdmin))
      })
      .catch(() => {
        if (active) {
          setIsAdmin(false)
        }
      })
      .finally(() => {
        if (active) {
          setIsLoaded(true)
        }
      })

    return () => {
      active = false
    }
  }, [])

  return { isAdmin, isLoaded }
}
