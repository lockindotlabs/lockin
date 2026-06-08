"use client"

import * as React from "react"

type AsyncState<T> = {
  data: T | null
  error: string | null
  isLoading: boolean
  reload: () => Promise<void>
}

export function useAdminData<T>(url: string): AsyncState<T> {
  const [data, setData] = React.useState<T | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  const reload = React.useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(url, { cache: "no-store" })

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`)
      }

      const nextData = (await response.json()) as T
      setData(nextData)
    } catch (fetchError) {
      const message =
        fetchError instanceof Error
          ? fetchError.message
          : "Could not load admin data."
      setError(message)
      setData(null)
    } finally {
      setIsLoading(false)
    }
  }, [url])

  React.useEffect(() => {
    void reload()
  }, [reload])

  return { data, error, isLoading, reload }
}
