"use client"

import { useEffect, useMemo, useState } from "react"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"

type FeedbackStatus = "OPEN" | "REVIEWED" | "ARCHIVED"

type FeedbackUser = {
  id: string
  email: string | null
  firstName: string | null
  lastName: string | null
  imageUrl: string | null
  role: string
}

type FeedbackItem = {
  id: string
  userId: string | null
  user: FeedbackUser | null
  message: string
  status: FeedbackStatus
  source: string
  path: string | null
  userAgent: string | null
  createdAt: string
  updatedAt: string
}

function getUserLabel(user: FeedbackUser | null) {
  if (!user) return "Unknown user"

  const name = [user.firstName, user.lastName].filter(Boolean).join(" ").trim()
  return name || user.email || user.id
}

function getStatusVariant(status: FeedbackStatus) {
  if (status === "OPEN") return "default"
  if (status === "REVIEWED") return "secondary"
  return "outline"
}

export function FeedbackPageClient() {
  const [items, setItems] = useState<FeedbackItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)

  const openCount = useMemo(
    () => items.filter((item) => item.status === "OPEN").length,
    [items]
  )

  useEffect(() => {
    let ignore = false

    async function loadFeedback() {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch("/api/admin/feedback")

        if (!response.ok) {
          throw new Error("Failed to load feedback")
        }

        const data = (await response.json()) as FeedbackItem[]

        if (!ignore) {
          setItems(data)
        }
      } catch {
        if (!ignore) {
          setError("Could not load feedback.")
        }
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    loadFeedback()

    return () => {
      ignore = true
    }
  }, [])

  async function updateStatus(id: string, status: FeedbackStatus) {
    setSavingId(id)
    setError(null)

    try {
      const response = await fetch(`/api/admin/feedback/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      })

      if (!response.ok) {
        throw new Error("Failed to update feedback")
      }

      const updated = (await response.json()) as FeedbackItem

      setItems((current) =>
        current.map((item) => (item.id === updated.id ? updated : item))
      )
    } catch {
      setError("Could not update feedback.")
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div className="flex flex-col gap-4 px-4 pb-8 sm:px-6 lg:px-8">
      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Open feedback</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{openCount}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total received</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{items.length}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Latest source</CardTitle>
          </CardHeader>
          <CardContent className="truncate text-sm text-muted-foreground">
            {items[0]?.path || "No feedback yet"}
          </CardContent>
        </Card>
      </div>

      {error ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Feedback</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    Loading feedback...
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No feedback has been submitted yet.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="align-top">
                      <div className="font-medium">{getUserLabel(item.user)}</div>
                      <div className="text-xs text-muted-foreground">
                        {item.user?.email || item.userId || "No user attached"}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xl align-top">
                      <div className="whitespace-pre-wrap text-sm">
                        {item.message}
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        {new Date(item.createdAt).toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell className="align-top">
                      <div className="text-sm">{item.source}</div>
                      <div className="max-w-52 truncate text-xs text-muted-foreground">
                        {item.path || "Unknown path"}
                      </div>
                    </TableCell>
                    <TableCell className="align-top">
                      <Badge variant={getStatusVariant(item.status)}>
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="align-top">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={savingId === item.id || item.status === "REVIEWED"}
                          onClick={() => updateStatus(item.id, "REVIEWED")}
                        >
                          Reviewed
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={savingId === item.id || item.status === "ARCHIVED"}
                          onClick={() => updateStatus(item.id, "ARCHIVED")}
                        >
                          Archive
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
