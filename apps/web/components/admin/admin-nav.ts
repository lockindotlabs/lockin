import {
  BarChart3Icon,
  CreditCardIcon,
  HomeIcon,
  Settings2Icon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react"

export type AdminNavMatch = "exact" | "prefix"

export type AdminNavItem = {
  title: string
  url: string
  icon: LucideIcon
  match: AdminNavMatch
}

export type AdminNavSection = {
  label: string
  items: AdminNavItem[]
}

export const adminNavSections: AdminNavSection[] = [
  {
    label: "Overview",
    items: [
      {
        title: "Analytics",
        url: "/app/admin/analytics",
        icon: BarChart3Icon,
        match: "prefix",
      },
    ],
  },
  {
    label: "Management",
    items: [
      {
        title: "Users",
        url: "/app/admin/users",
        icon: UsersIcon,
        match: "prefix",
      },
    ],
  },
  {
    label: "Revenue",
    items: [
      {
        title: "Billing & Quotas",
        url: "/app/admin/billing",
        icon: CreditCardIcon,
        match: "prefix",
      },
    ],
  },
  {
    label: "System",
    items: [
      {
        title: "Settings",
        url: "/app/admin/settings",
        icon: Settings2Icon,
        match: "prefix",
      },
    ],
  },
  {
    label: "Workspace",
    items: [
      {
        title: "Back to app",
        url: "/app",
        icon: HomeIcon,
        match: "exact",
      },
    ],
  },
]

// export const adminNavItems = adminNavSections.reduce((acc, section) => {
//   return [...acc, ...section.items]
// }, [] as AdminNavItem[])

export const adminNavItems: AdminNavItem[] = [
  {
    title: "Overview",
    url: "/app/admin/overview",
    icon: BarChart3Icon,
    match: "prefix",
  },
  {
    title: "Usage & Retention",
    url: "/app/admin/usage",
    icon: UsersIcon,
    match: "prefix",
  },
  {
    title: "Billing & Quotas",
    url: "/app/admin/billing",
    icon: CreditCardIcon,
    match: "prefix",
  },
  {
    title: "Settings",
    url: "/app/admin/settings",
    icon: Settings2Icon,
    match: "prefix",
  },
]

export function isAdminNavItemActive(item: AdminNavItem, pathname: string) {
  if (item.match === "exact") {
    return pathname === item.url
  }

  return pathname === item.url || pathname.startsWith(`${item.url}/`)
}
