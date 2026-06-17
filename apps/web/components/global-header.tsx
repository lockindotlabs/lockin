import { RedirectToSignIn, Show } from "@clerk/nextjs"
import { Bell01, List } from "@untitledui/icons"
import { Button } from "@workspace/ui/components/button"
import { SidebarTrigger, useSidebar } from "@workspace/ui/components/sidebar"
import { ChevronDown, CoinsIcon } from "lucide-react"
import { NavUser } from "./nav-user"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@workspace/ui/components/breadcrumb"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@workspace/ui/components/dropdown-menu"

export default function GlobalHeader({ page }: { page: "plan" | "ask" }) {
  const { state } = useSidebar()
  return (
    <div className="flex h-12 items-center justify-between border-b px-3">
      <div className="flex items-center gap-2">
        <SidebarTrigger
          className={`${state === "collapsed" ? "" : "pointer-events-none opacity-0"} transition-opacity`}
        />
        <Breadcrumb
          className={`${state === "collapsed" ? "" : "-translate-x-11"} text-sm font-medium transition-all`}
        >
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink
                render={
                  <Button
                    variant={"ghost"}
                    size={"sm"}
                    className={"font-normal"}
                  />
                }
              >
                Ask
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="line-clamp-1">
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button
                        variant={"ghost"}
                        size={"sm"}
                        className={"font-normal"}
                      >
                        Chat
                        <ChevronDown data-icon="inline-end" />
                      </Button>
                    }
                  />
                  <DropdownMenuContent align="start" className="max-w-80">
                    <DropdownMenuGroup>
                      <DropdownMenuLabel>Previous 7 days</DropdownMenuLabel>
                      <DropdownMenuItem>Chat</DropdownMenuItem>
                      <DropdownMenuItem>Create a new page</DropdownMenuItem>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                      <DropdownMenuLabel>Older</DropdownMenuLabel>
                      <DropdownMenuItem>Capabilities overview</DropdownMenuItem>
                      <DropdownMenuItem>Previous chat</DropdownMenuItem>
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <Show when="signed-out">
        <RedirectToSignIn />
      </Show>
      <div className="flex items-center gap-2">
        <Button variant={"outline"} size={"sm"}>
          <List />
          <span>2/3 created</span>
        </Button>
        <Button variant={"outline"} size={"sm"}>
          <CoinsIcon />
          <span>1000</span>
        </Button>
        <Button variant={"ghost"} size={"icon-sm"}>
          <Bell01 />
        </Button>
        <NavUser />
      </div>
    </div>
  )
}
