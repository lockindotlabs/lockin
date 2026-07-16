"use client"

import * as React from "react"
import {
  AlertTriangleIcon,
  ArrowUpRightIcon,
  CheckCircle2Icon,
  ClockIcon,
  XCircleIcon,
} from "lucide-react"

import type { AdminBillingTransaction } from "@/types/admin-analytics"
import { Badge } from "@workspace/ui/components/badge"
import { buttonVariants } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@workspace/ui/components/empty"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"

const statusFilters = [
  { label: "All transactions", value: "all" },
  { label: "Paid", value: "PAID" },
  { label: "Pending", value: "PENDING" },
  { label: "Failed/Cancelled", value: "failed_cancelled" },
]

function StatusBadge({ status }: { status: AdminBillingTransaction["status"] }) {
  if (status === "PAID") {
    return (
      <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30 gap-1.5 py-0.5">
        <CheckCircle2Icon className="h-3.5 w-3.5" />
        Paid
      </Badge>
    )
  }

  if (status === "PENDING") {
    return (
      <Badge variant="secondary" className="bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border-amber-100 dark:border-amber-900/30 gap-1.5 py-0.5 animate-pulse">
        <ClockIcon className="h-3.5 w-3.5" />
        Pending
      </Badge>
    )
  }

  if (status === "FAILED") {
    return (
      <Badge variant="destructive" className="gap-1.5 py-0.5">
        <AlertTriangleIcon className="h-3.5 w-3.5" />
        Failed
      </Badge>
    )
  }

  if (status === "CANCELLED") {
    return (
      <Badge variant="secondary" className="bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 border-rose-100 dark:border-rose-900/30 gap-1.5 py-0.5">
        <XCircleIcon className="h-3.5 w-3.5" />
        Cancelled
      </Badge>
    )
  }

  return (
    <Badge variant="secondary" className="bg-slate-50 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400 border-slate-100 dark:border-slate-800/30 gap-1.5 py-0.5">
      <ClockIcon className="h-3.5 w-3.5" />
      Expired
    </Badge>
  )
}

function PlanBadge({ tier }: { tier: AdminBillingTransaction["tier"] }) {
  if (tier === "PRO") {
    return (
      <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/30">
        Pro
      </Badge>
    )
  }
  if (tier === "PLUS") {
    return (
      <Badge variant="secondary" className="bg-sky-50 text-sky-700 dark:bg-sky-950/30 dark:text-sky-400 border-sky-100 dark:border-sky-900/30">
        Plus
      </Badge>
    )
  }
  return <Badge variant="outline">Free</Badge>
}

export function TransactionHistoryTable({
  transactions,
}: {
  transactions: AdminBillingTransaction[]
}) {
  const [filter, setFilter] = React.useState("all")

  const filteredTransactions = React.useMemo(() => {
    if (!transactions) return []
    if (filter === "all") return transactions
    if (filter === "PAID") return transactions.filter((tx) => tx.status === "PAID")
    if (filter === "PENDING") return transactions.filter((tx) => tx.status === "PENDING")
    if (filter === "failed_cancelled") {
      return transactions.filter(
        (tx) => tx.status === "FAILED" || tx.status === "CANCELLED" || tx.status === "EXPIRED"
      )
    }
    return transactions
  }, [transactions, filter])

  const formatCurrency = (amount: number, currency: string) => {
    if (currency === "VND") {
      return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }).format(amount)
    }
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(amount)
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d)
  }

  return (
    <Card className="w-full border border-border bg-card shadow-sm">
      <CardHeader className="flex flex-col gap-1.5">
        <CardTitle className="text-xl font-semibold tracking-tight">Transaction history</CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Recent payment transactions and order completions via payOS.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <Tabs value={filter} onValueChange={setFilter} className="w-full">
          <TabsList aria-label="Transaction status filter" className="inline-flex h-9 items-center justify-start rounded-lg bg-muted p-1 text-muted-foreground">
            {statusFilters.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {filteredTransactions.length > 0 ? (
          <div className="relative w-full overflow-auto rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                  <TableHead className="h-10 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">Order Code</TableHead>
                  <TableHead className="h-10 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">User</TableHead>
                  <TableHead className="h-10 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">Plan</TableHead>
                  <TableHead className="h-10 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">Amount</TableHead>
                  <TableHead className="h-10 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">Status</TableHead>
                  <TableHead className="h-10 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">Date</TableHead>
                  <TableHead className="h-10 px-4 text-right align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((tx) => {
                  const userName =
                    tx.user.firstName || tx.user.lastName
                      ? `${tx.user.firstName ?? ""} ${tx.user.lastName ?? ""}`.trim()
                      : null
                  return (
                    <TableRow key={tx.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                      <TableCell className="p-4 align-middle [&:has([role=checkbox])]:pr-0 font-mono text-sm font-medium">
                        #{tx.payosOrderCode}
                      </TableCell>
                      <TableCell className="p-4 align-middle [&:has([role=checkbox])]:pr-0">
                        <div className="flex flex-col gap-0.5">
                          {userName && <span className="font-medium text-foreground">{userName}</span>}
                          <span className={`text-xs ${userName ? "text-muted-foreground font-mono" : "text-foreground font-mono font-medium"}`}>
                            {tx.user.email ?? tx.user.id}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="p-4 align-middle [&:has([role=checkbox])]:pr-0">
                        <PlanBadge tier={tx.tier} />
                      </TableCell>
                      <TableCell className="p-4 align-middle [&:has([role=checkbox])]:pr-0 font-medium text-foreground">
                        {formatCurrency(tx.amount, tx.currency)}
                      </TableCell>
                      <TableCell className="p-4 align-middle [&:has([role=checkbox])]:pr-0">
                        <StatusBadge status={tx.status} />
                      </TableCell>
                      <TableCell className="p-4 align-middle [&:has([role=checkbox])]:pr-0 text-sm text-muted-foreground">
                        {formatDate(tx.createdAt)}
                      </TableCell>
                      <TableCell className="p-4 align-middle [&:has([role=checkbox])]:pr-0 text-right">
                        {tx.status === "PENDING" && tx.checkoutUrl ? (
                          <a
                            href={tx.checkoutUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={cn(
                              buttonVariants({ variant: "outline", size: "sm" }),
                              "h-8 gap-1.5"
                            )}
                          >
                            Resume
                            <ArrowUpRightIcon className="h-3.5 w-3.5" />
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <Empty className="py-12 border border-dashed rounded-lg border-muted">
            <EmptyHeader>
              <EmptyTitle>No transactions found</EmptyTitle>
              <EmptyDescription>
                There are no transaction records matching the current filter.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </CardContent>
    </Card>
  )
}
