"use client"

import * as React from "react"
import { useAuth } from "@clerk/nextjs"
import {
  Ban,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Crown,
  Filter,
  Lock,
  MoreHorizontal,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  SlidersHorizontal,
  Unlock,
  UserCheck,
  UserCog,
  Users,
} from "lucide-react"
import { toast } from "sonner"

import { AdminPageHeader } from "@/components/admin/AdminPageHeader"
import {
  AnalyticsErrorState,
  AnalyticsLoadingState,
} from "@/components/admin/analytics/AnalyticsState"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty"
import { useAdminData } from "@/lib/admin/use-admin-data"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { Input } from "@workspace/ui/components/input"
import { ScrollArea } from "@workspace/ui/components/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"

type User = {
  id: string
  email: string | null
  firstName: string | null
  lastName: string | null
  imageUrl: string | null
  role: string
  banned: boolean
  locked: boolean
  isActive: boolean
  planTier: "FREE" | "PLUS" | "PRO"
  createdAt: string
  updatedAt: string
}

export function UsersPageClient() {
  const { userId: activeUserId } = useAuth()
  const {
    data: users,
    error,
    isLoading,
    reload,
  } = useAdminData<User[]>("/api/admin/users")

  const [searchQuery, setSearchQuery] = React.useState("")
  const [roleFilter, setRoleFilter] = React.useState<"ALL" | "ADMIN" | "USER">(
    "ALL"
  )
  const [statusFilter, setStatusFilter] = React.useState<
    "ALL" | "ACTIVE" | "BANNED" | "LOCKED"
  >("ALL")
  const [planFilter, setPlanFilter] = React.useState<
    "ALL" | "FREE" | "PLUS" | "PRO"
  >("ALL")
  const [mutatingId, setMutatingId] = React.useState<string | null>(null)

  // Columns visibility state
  const [columnVisibility, setColumnVisibility] = React.useState({
    username: false, // hidden by default since it is mock '-'
    phoneNumber: false, // hidden by default since it is mock '-'
    role: true,
    plan: true,
    status: true,
    lastSignIn: true,
    joined: true,
  })

  // Columns labels mapping
  const columnLabels = {
    username: "Username",
    phoneNumber: "Phone number",
    role: "Role",
    plan: "Plan",
    status: "Status",
    lastSignIn: "Last signed in",
    joined: "Joined",
  }

  // Pagination states
  const [pageSize, setPageSize] = React.useState(10)
  const [currentPage, setCurrentPage] = React.useState(1)

  // Calculations for stats
  const stats = React.useMemo(() => {
    if (!users)
      return { total: 0, active: 0, banned: 0, locked: 0, proOrPlus: 0 }
    return {
      total: users.length,
      active: users.filter((u) => !u.banned && !u.locked).length,
      banned: users.filter((u) => u.banned).length,
      locked: users.filter((u) => u.locked).length,
      proOrPlus: users.filter(
        (u) => u.planTier === "PRO" || u.planTier === "PLUS"
      ).length,
    }
  }, [users])

  // Filtered users list
  const filteredUsers = React.useMemo(() => {
    if (!users) return []
    return users.filter((u) => {
      const fullName = `${u.firstName || ""} ${u.lastName || ""}`.toLowerCase()
      const email = (u.email || "").toLowerCase()
      const id = u.id.toLowerCase()
      const query = searchQuery.toLowerCase()

      const matchesSearch =
        fullName.includes(query) || email.includes(query) || id.includes(query)

      const matchesRole =
        roleFilter === "ALL" ||
        (roleFilter === "ADMIN" && u.role === "admin") ||
        (roleFilter === "USER" && u.role === "user")

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && !u.banned && !u.locked) ||
        (statusFilter === "BANNED" && u.banned) ||
        (statusFilter === "LOCKED" && u.locked)

      const matchesPlan = planFilter === "ALL" || u.planTier === planFilter

      return matchesSearch && matchesRole && matchesStatus && matchesPlan
    })
  }, [users, searchQuery, roleFilter, statusFilter, planFilter])

  // Pagination calculations
  const totalItems = filteredUsers.length
  const totalPages = Math.ceil(totalItems / pageSize) || 1

  // Adjust current page if filters shrink total items count
  React.useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [totalItems, pageSize, totalPages, currentPage])

  // Paginated chunk
  const paginatedUsers = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize
    const end = start + pageSize
    return filteredUsers.slice(start, end)
  }, [filteredUsers, currentPage, pageSize])

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalItems)

  const handleUpdateState = async (
    targetId: string,
    updates: { role?: string; banned?: boolean; locked?: boolean }
  ) => {
    if (targetId === activeUserId) {
      toast.error(
        "Security alert: You cannot change your own administrative state."
      )
      return
    }

    setMutatingId(targetId)
    const promise = fetch(`/api/admin/users/${targetId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    }).then(async (res) => {
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Failed to update user state")
      }
      return data
    })

    toast.promise(promise, {
      loading: "Updating user configuration in Clerk...",
      success: () => {
        void reload()
        return "User state updated successfully."
      },
      error: (err) => err.message || "Failed to update user configuration.",
    })

    try {
      await promise
    } catch (e) {
      console.error(e)
    } finally {
      setMutatingId(null)
    }
  }

  // Format dates consistently (e.g. May 17, 2026)
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-"
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return "-"
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  // Dynamically compute colSpan for empty row matching visible columns
  const visibleColumnCount = React.useMemo(() => {
    let count = 2 // User & Actions columns are always visible
    if (columnVisibility.username) count++
    if (columnVisibility.phoneNumber) count++
    if (columnVisibility.role) count++
    if (columnVisibility.plan) count++
    if (columnVisibility.status) count++
    if (columnVisibility.lastSignIn) count++
    if (columnVisibility.joined) count++
    return count
  }, [columnVisibility])

  const hasData = (users?.length ?? 0) > 0

  return (
    <>
      <ScrollArea className="flex h-[calc(100vh-1rem)] flex-col overflow-y-auto bg-background/50 text-foreground">
        <div className="relative mt-12 max-h-[88px] min-h-[20px] w-full overflow-hidden">
          <div className="relative w-full pb-0 xl:pb-[calc(50%-576px)]" />
        </div>
        <main className="flex flex-col bg-background text-foreground">
          <AdminPageHeader
            icon={UserCog}
            title="Users"
            description="Manage user access levels, roles, and programmatic security lockouts/bans."
            actions={
              <Button
                variant="outline"
                size="sm"
                onClick={() => void reload()}
                disabled={isLoading}
                className="gap-2 border-border/80 bg-background/40 backdrop-blur-xs hover:bg-muted"
              >
                <RefreshCw
                  className={isLoading ? "animate-spin" : undefined}
                  data-icon="inline-start"
                />
                <span>Refresh</span>
              </Button>
            }
          />

          {isLoading && !users ? <AnalyticsLoadingState /> : null}
          {!isLoading && error ? <AnalyticsErrorState /> : null}
          {!isLoading && !error && !hasData ? (
            <div className="px-4 pb-10 sm:px-6 lg:px-8">
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Users aria-hidden="true" />
                  </EmptyMedia>
                  <EmptyTitle>No users found</EmptyTitle>
                  <EmptyDescription>
                    Users will automatically populate here when they sign in to
                    LockIn.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            </div>
          ) : null}

          {users && hasData ? (
            <div className="flex flex-col gap-6 px-4 pb-10 sm:px-6 lg:px-8">
              {/* Stats Overview */}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {/* Total Users */}
                <Card size="sm">
                  <CardHeader>
                    <CardTitle>Total Users</CardTitle>
                    <CardAction>
                      <Users
                        className="size-4 text-muted-foreground"
                        aria-hidden="true"
                      />
                    </CardAction>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-semibold tracking-tight">
                      {stats.total}
                    </p>
                  </CardContent>
                </Card>

                {/* Active Sessions */}
                <Card size="sm">
                  <CardHeader>
                    <CardTitle>Active Sessions</CardTitle>
                    <CardAction>
                      <UserCheck
                        className="size-4 text-muted-foreground"
                        aria-hidden="true"
                      />
                    </CardAction>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-semibold tracking-tight">
                      {stats.active}
                    </p>
                  </CardContent>
                </Card>

                {/* Banned Accounts */}
                <Card size="sm">
                  <CardHeader>
                    <CardTitle>Banned Accounts</CardTitle>
                    <CardAction>
                      <Ban
                        className="size-4 text-muted-foreground"
                        aria-hidden="true"
                      />
                    </CardAction>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-semibold tracking-tight">
                      {stats.banned}
                    </p>
                  </CardContent>
                </Card>

                {/* Locked Accounts */}
                <Card size="sm">
                  <CardHeader>
                    <CardTitle>Locked Accounts</CardTitle>
                    <CardAction>
                      <Lock
                        className="size-4 text-muted-foreground"
                        aria-hidden="true"
                      />
                    </CardAction>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-semibold tracking-tight">
                      {stats.locked}
                    </p>
                  </CardContent>
                </Card>

                {/* Premium Users */}
                <Card size="sm" className="col-span-2 lg:col-span-1">
                  <CardHeader>
                    <CardTitle>Premium Users</CardTitle>
                    <CardAction>
                      <Crown
                        className="size-4 text-muted-foreground"
                        aria-hidden="true"
                      />
                    </CardAction>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-semibold tracking-tight">
                      {stats.proOrPlus}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Controls Row (Search, Columns, Filters) */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative max-w-sm flex-1">
                  <Search className="absolute top-2.5 left-3 size-4 text-muted-foreground/75" />
                  <Input
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      setCurrentPage(1)
                    }}
                    className="rounded-md border-border/70 bg-background/50 pl-9"
                  />
                </div>

                <div className="flex items-center gap-2">
                  {/* Columns Visibility Toggle */}
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          variant="outline"
                          className="gap-2 rounded-md border-border/70 bg-background/50"
                        />
                      }
                    >
                      <SlidersHorizontal data-icon="inline-start" />
                      <span>Columns</span>
                      <ChevronDown data-icon="inline-end" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-48 rounded-md bg-popover p-1"
                    >
                      <DropdownMenuGroup>
                        <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {Object.keys(columnLabels).map((columnKey) => (
                          <DropdownMenuCheckboxItem
                            key={columnKey}
                            checked={
                              columnVisibility[
                                columnKey as keyof typeof columnVisibility
                              ]
                            }
                            onCheckedChange={(checked) =>
                              setColumnVisibility((prev) => ({
                                ...prev,
                                [columnKey]: !!checked,
                              }))
                            }
                          >
                            {
                              columnLabels[
                                columnKey as keyof typeof columnLabels
                              ]
                            }
                          </DropdownMenuCheckboxItem>
                        ))}
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Filters Menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          variant="outline"
                          size="icon"
                          className="rounded-md border-border/70 bg-background/50"
                          aria-label="Filter options"
                        />
                      }
                    >
                      <Filter />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-56 rounded-md bg-popover p-1"
                    >
                      <DropdownMenuGroup>
                        <DropdownMenuLabel>Filter Directory</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                      </DropdownMenuGroup>

                      {/* Role Filters */}
                      <DropdownMenuRadioGroup
                        value={roleFilter}
                        onValueChange={(val) => {
                          setRoleFilter(val as any)
                          setCurrentPage(1)
                        }}
                      >
                        <DropdownMenuLabel className="py-1 text-[10px] font-bold tracking-wider text-muted-foreground/80 uppercase">
                          Role
                        </DropdownMenuLabel>
                        <DropdownMenuRadioItem value="ALL">
                          All Roles
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="ADMIN">
                          Admins
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="USER">
                          Users
                        </DropdownMenuRadioItem>
                      </DropdownMenuRadioGroup>
                      <DropdownMenuSeparator />

                      {/* Status Filters */}
                      <DropdownMenuRadioGroup
                        value={statusFilter}
                        onValueChange={(val) => {
                          setStatusFilter(val as any)
                          setCurrentPage(1)
                        }}
                      >
                        <DropdownMenuLabel className="py-1 text-[10px] font-bold tracking-wider text-muted-foreground/80 uppercase">
                          Status
                        </DropdownMenuLabel>
                        <DropdownMenuRadioItem value="ALL">
                          All Statuses
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="ACTIVE">
                          Active Only
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="BANNED">
                          Banned Only
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="LOCKED">
                          Locked Only
                        </DropdownMenuRadioItem>
                      </DropdownMenuRadioGroup>
                      <DropdownMenuSeparator />

                      {/* Plan Filters */}
                      <DropdownMenuRadioGroup
                        value={planFilter}
                        onValueChange={(val) => {
                          setPlanFilter(val as any)
                          setCurrentPage(1)
                        }}
                      >
                        <DropdownMenuLabel className="py-1 text-[10px] font-bold tracking-wider text-muted-foreground/80 uppercase">
                          Plan
                        </DropdownMenuLabel>
                        <DropdownMenuRadioItem value="ALL">
                          All Plans
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="FREE">
                          Free
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="PLUS">
                          Plus
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="PRO">
                          Pro
                        </DropdownMenuRadioItem>
                      </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Users Table */}
              <div className="overflow-hidden rounded-lg border border-border/60 bg-card">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-[300px] pl-4 text-xs">
                        User
                      </TableHead>
                      {columnVisibility.username && (
                        <TableHead className="text-xs">Username</TableHead>
                      )}
                      {columnVisibility.phoneNumber && (
                        <TableHead className="text-xs">Phone number</TableHead>
                      )}
                      {columnVisibility.role && (
                        <TableHead className="text-xs">Role</TableHead>
                      )}
                      {columnVisibility.plan && (
                        <TableHead className="text-xs">Plan</TableHead>
                      )}
                      {columnVisibility.status && (
                        <TableHead className="text-xs">Status</TableHead>
                      )}
                      {columnVisibility.lastSignIn && (
                        <TableHead className="text-xs">
                          Last signed in
                        </TableHead>
                      )}
                      {columnVisibility.joined && (
                        <TableHead className="text-xs">Joined</TableHead>
                      )}
                      <TableHead className="w-[80px] pr-4 text-right text-xs">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedUsers.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={visibleColumnCount}
                          className="h-32 text-center text-sm text-muted-foreground"
                        >
                          No users matching the filter criteria.
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedUsers.map((user) => {
                        const isSelf = user.id === activeUserId
                        const isUserBanned = user.banned
                        const isUserLocked = user.locked
                        const isUserAdmin = user.role === "admin"

                        return (
                          <TableRow
                            key={user.id}
                            className="transition-colors hover:bg-muted/10"
                          >
                            {/* User details */}
                            <TableCell className="pl-4 font-medium">
                              <div className="flex items-center gap-3">
                                <Avatar className="size-9">
                                  <AvatarImage
                                    src={user.imageUrl || undefined}
                                    alt="Profile"
                                  />
                                  <AvatarFallback>
                                    {(user.firstName || user.email || "U")
                                      .charAt(0)
                                      .toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex min-w-0 flex-col">
                                  <span className="flex items-center gap-1.5 truncate text-xs font-medium text-foreground">
                                    {user.firstName || user.lastName
                                      ? `${user.firstName || ""} ${user.lastName || ""}`
                                      : "LockIn User"}
                                    {isSelf && (
                                      <Badge
                                        variant="secondary"
                                        className="h-4 bg-muted px-1 py-0 text-[10px] text-muted-foreground"
                                      >
                                        You
                                      </Badge>
                                    )}
                                  </span>
                                  <span className="truncate text-2xs font-normal text-muted-foreground">
                                    {user.email || "No email available"}
                                  </span>
                                </div>
                              </div>
                            </TableCell>

                            {/* Username Column */}
                            {columnVisibility.username && (
                              <TableCell className="text-xs font-normal text-muted-foreground">
                                -
                              </TableCell>
                            )}

                            {/* Phone Number Column */}
                            {columnVisibility.phoneNumber && (
                              <TableCell className="text-xs font-normal text-muted-foreground">
                                -
                              </TableCell>
                            )}

                            {/* User role */}
                            {columnVisibility.role && (
                              <TableCell>
                                <Badge
                                  variant={
                                    isUserAdmin ? "default" : "secondary"
                                  }
                                  className={
                                    isUserAdmin
                                      ? "border-none bg-purple-100 text-2xs text-purple-800 hover:bg-purple-100 dark:bg-purple-950/50 dark:text-purple-300"
                                      : "border-none text-2xs"
                                  }
                                >
                                  {user.role === "admin" ? "Admin" : "User"}
                                </Badge>
                              </TableCell>
                            )}

                            {/* Plan tier */}
                            {columnVisibility.plan && (
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={
                                    user.planTier === "PRO"
                                      ? "border-amber-500/50 bg-amber-500/5 text-2xs text-amber-700 dark:text-amber-400"
                                      : user.planTier === "PLUS"
                                        ? "border-indigo-500/50 bg-indigo-500/5 text-2xs text-indigo-700 dark:text-indigo-400"
                                        : "border-border/60 text-2xs text-muted-foreground"
                                  }
                                >
                                  {user.planTier}
                                </Badge>
                              </TableCell>
                            )}

                            {/* Status badge */}
                            {columnVisibility.status && (
                              <TableCell>
                                <div className="flex items-center gap-1.5">
                                  {isUserBanned ? (
                                    <Badge className="gap-1 border-none bg-red-100 text-2xs text-red-800 hover:bg-red-100 dark:bg-red-950/50 dark:text-red-300">
                                      <Ban className="size-3" />
                                      <span>Banned</span>
                                    </Badge>
                                  ) : isUserLocked ? (
                                    <Badge className="gap-1 border-none bg-amber-100 text-2xs text-amber-800 hover:bg-amber-100 dark:bg-amber-950/50 dark:text-amber-300">
                                      <Lock className="size-3" />
                                      <span>Locked</span>
                                    </Badge>
                                  ) : (
                                    <Badge className="gap-1 border-none bg-emerald-100 text-2xs text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300">
                                      <UserCheck className="size-3" />
                                      <span>Active</span>
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                            )}

                            {/* Last signed in */}
                            {columnVisibility.lastSignIn && (
                              <TableCell className="text-xs font-normal text-muted-foreground">
                                {formatDate(user.updatedAt)}
                              </TableCell>
                            )}

                            {/* Joined */}
                            {columnVisibility.joined && (
                              <TableCell className="text-xs font-normal text-muted-foreground">
                                {formatDate(user.createdAt)}
                              </TableCell>
                            )}

                            {/* Actions Dropdown */}
                            <TableCell className="pr-4 text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger
                                  render={
                                    <Button
                                      variant="ghost"
                                      size="icon-xs"
                                      className="text-muted-foreground hover:text-foreground"
                                      disabled={mutatingId === user.id}
                                      aria-label="User actions"
                                    />
                                  }
                                >
                                  <MoreHorizontal />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align="end"
                                  className="w-48 rounded-md bg-popover p-1"
                                >
                                  <DropdownMenuGroup>
                                    <DropdownMenuLabel>
                                      Actions
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />

                                    <DropdownMenuItem
                                      disabled={isSelf}
                                      onClick={() =>
                                        void handleUpdateState(user.id, {
                                          role: isUserAdmin ? "user" : "admin",
                                        })
                                      }
                                    >
                                      {isUserAdmin ? (
                                        <>
                                          <ShieldAlert className="text-muted-foreground" />
                                          <span>Demote to User</span>
                                        </>
                                      ) : (
                                        <>
                                          <Shield className="text-muted-foreground" />
                                          <span>Promote to Admin</span>
                                        </>
                                      )}
                                    </DropdownMenuItem>

                                    <DropdownMenuItem
                                      disabled={isSelf}
                                      onClick={() =>
                                        void handleUpdateState(user.id, {
                                          locked: !isUserLocked,
                                        })
                                      }
                                    >
                                      {isUserLocked ? (
                                        <>
                                          <Unlock className="text-muted-foreground" />
                                          <span>Unlock Account</span>
                                        </>
                                      ) : (
                                        <>
                                          <Lock className="text-muted-foreground" />
                                          <span>Lock Account</span>
                                        </>
                                      )}
                                    </DropdownMenuItem>

                                    <DropdownMenuSeparator />

                                    <DropdownMenuItem
                                      disabled={isSelf}
                                      variant={
                                        isUserBanned ? "default" : "destructive"
                                      }
                                      onClick={() =>
                                        void handleUpdateState(user.id, {
                                          banned: !isUserBanned,
                                        })
                                      }
                                    >
                                      {isUserBanned ? (
                                        <>
                                          <UserCheck className="text-emerald-600 dark:text-emerald-400" />
                                          <span className="text-emerald-600 dark:text-emerald-400">
                                            Unban Account
                                          </span>
                                        </>
                                      ) : (
                                        <>
                                          <Ban className="text-destructive" />
                                          <span>Ban Account</span>
                                        </>
                                      )}
                                    </DropdownMenuItem>
                                  </DropdownMenuGroup>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>

                {/* Table Footer with Pagination */}
                <div className="flex flex-col gap-4 rounded-b-xl border-t border-border/60 bg-muted/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  {/* Left side: Range indicators & Page size */}
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
                    <span className="">
                      {startItem}–{endItem} of {totalItems}
                    </span>
                    <div className="flex items-center gap-2">
                      <span>Results per page</span>
                      <Select
                        value={String(pageSize)}
                        onValueChange={(val) => {
                          setPageSize(Number(val))
                          setCurrentPage(1)
                        }}
                      >
                        <SelectTrigger className="h-8 w-16 rounded-md border-border/70 bg-background/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="min-w-16 rounded-md bg-popover p-1">
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="20">20</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Right side: Page controls */}
                  <div className="flex items-center gap-1 self-end sm:self-auto">
                    {/* First Page */}
                    <Button
                      variant="outline"
                      size="icon-sm"
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      aria-label="First page"
                    >
                      <ChevronsLeft />
                    </Button>

                    {/* Previous Page */}
                    <Button
                      variant="outline"
                      size="icon-sm"
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={currentPage === 1}
                      aria-label="Previous page"
                    >
                      <ChevronLeft />
                    </Button>

                    {/* Page indicator */}
                    <span className="px-3 text-xs font-medium">
                      {currentPage} / {totalPages}
                    </span>

                    {/* Next Page */}
                    <Button
                      variant="outline"
                      size="icon-sm"
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                      }
                      disabled={currentPage === totalPages}
                      aria-label="Next page"
                    >
                      <ChevronRight />
                    </Button>

                    {/* Last Page */}
                    <Button
                      variant="outline"
                      size="icon-sm"
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      aria-label="Last page"
                    >
                      <ChevronsRight />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </main>
      </ScrollArea>
    </>
  )
}
