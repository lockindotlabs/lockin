"use client"

import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  CircleIcon,
  InfoIcon,
  XCircleIcon,
} from "lucide-react"

import type { EventFilter, RecentActivityEvent } from "@/types/admin-analytics"
import { Badge } from "@workspace/ui/components/badge"
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"

const eventFilters: { label: string; value: EventFilter }[] = [
  { label: "All events", value: "all" },
  { label: "Sprint events", value: "sprint" },
  { label: "AI events", value: "ai" },
  { label: "Quota events", value: "quota" },
  { label: "Upgrade events", value: "upgrade" },
  { label: "Errors only", value: "errors" },
]

function StatusBadge({ status }: { status: RecentActivityEvent["status"] }) {
  if (status === "success") {
    return (
      <Badge variant="secondary">
        <CheckCircle2Icon data-icon="inline-start" />
        Success
      </Badge>
    )
  }

  if (status === "error") {
    return (
      <Badge variant="destructive">
        <XCircleIcon data-icon="inline-start" />
        Error
      </Badge>
    )
  }

  if (status === "warning") {
    return (
      <Badge variant="outline">
        <AlertTriangleIcon data-icon="inline-start" />
        Warning
      </Badge>
    )
  }

  if (status === "info") {
    return (
      <Badge variant="outline">
        <InfoIcon data-icon="inline-start" />
        Info
      </Badge>
    )
  }

  return (
    <Badge variant="outline">
      <CircleIcon data-icon="inline-start" />
      Neutral
    </Badge>
  )
}

export function RecentActivityTable({
  events,
  activeFilter,
  onActiveFilterChange,
}: {
  events: RecentActivityEvent[]
  activeFilter: EventFilter
  onActiveFilterChange: (filter: EventFilter) => void
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent activity</CardTitle>
        <CardDescription>
          Latest mock product events across planning, Sprint, quota, and billing
          surfaces.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs
          value={activeFilter}
          onValueChange={(nextValue) => {
            if (nextValue) {
              onActiveFilterChange(nextValue as EventFilter)
            }
          }}
        >
          <div className="overflow-x-auto">
            <TabsList aria-label="Recent activity filter">
              {eventFilters.map((filter) => (
                <TabsTrigger key={filter.value} value={filter.value}>
                  {filter.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          {eventFilters.map((filter) => (
            <TabsContent key={filter.value} value={filter.value}>
              {events.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Event</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {events.map((event) => (
                      <TableRow key={`${event.user}-${event.time}`}>
                        <TableCell>
                          <span className="font-mono text-sm">
                            {event.user}
                          </span>
                        </TableCell>
                        <TableCell>{event.event}</TableCell>
                        <TableCell>{event.details}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{event.plan}</Badge>
                        </TableCell>
                        <TableCell>{event.time}</TableCell>
                        <TableCell>
                          <StatusBadge status={event.status} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Empty>
                  <EmptyHeader>
                    <EmptyTitle>No matching events.</EmptyTitle>
                    <EmptyDescription>
                      Try a different activity filter.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  )
}
