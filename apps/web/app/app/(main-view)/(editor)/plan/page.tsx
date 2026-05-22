"use client"

import * as React from "react"
import { format } from "date-fns"
import { NavActions } from "@/components/nav-actions"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@workspace/ui/components/breadcrumb"
import { Separator } from "@workspace/ui/components/separator"
import { SidebarTrigger } from "@workspace/ui/components/sidebar"
import PlanDetails from "./PlanDetails"
import TaskList from "./TaskList"
import { RightAiSidebarTrigger } from "@/components/right-ai-sidebar-provider"
import { ScrollArea } from "@workspace/ui/components/scroll-area"

export default function Page() {
  const planJson = `{
    "plan": {
      "title": "Launch new marketing campaign",
      "description": "Plan and execute the launch of our new marketing campaign for the upcoming product release.",
      "dueDate": "2026-05-30",
      "steps": {"count": 5, "hours": 10},
      "completion": "Campaign Launch"
    },
    "tasks": [
      {"taskTitle": "Define campaign goals", "taskDescription": "Identify the key objectives and KPIs for the campaign.", "dueDate": "2026-05-10", "isCompleted": true},
      {"taskTitle": "Develop creative assets", "taskDescription": "Create visuals, copy, and other materials needed for the campaign.", "dueDate": "2026-05-15", "isCompleted": false},
      {"taskTitle": "Set up advertising channels", "taskDescription": "Configure and optimize ad accounts on platforms like Google Ads and Facebook.", "dueDate": "2026-05-20", "isCompleted": false},
      {"taskTitle": "Launch campaign", "taskDescription": "Go live with the campaign and monitor initial performance.", "dueDate": "2026-05-30", "isCompleted": false},
      {"taskTitle": "Analyze results", "taskDescription": "Evaluate the campaign's performance against the defined KPIs and prepare a report.", "dueDate": "2026-06-15", "isCompleted": false},
      {"taskTitle": "Analyze results", "taskDescription": "Evaluate the campaign's performance against the defined KPIs and prepare a report.", "dueDate": "2026-06-15", "isCompleted": false},
      {"taskTitle": "Analyze results", "taskDescription": "Evaluate the campaign's performance against the defined KPIs and prepare a report.", "dueDate": "2026-06-15", "isCompleted": false},
      {"taskTitle": "Analyze results", "taskDescription": "Evaluate the campaign's performance against the defined KPIs and prepare a report.", "dueDate": "2026-06-15", "isCompleted": false}
    ]
  }`

  const data = JSON.parse(planJson)
  const planDetails = data.plan
  const tasks: Array<any> = data.tasks

  const [persisted, setPersisted] = React.useState(() =>
    tasks.map((t: any) => ({
      savedTitle: t.taskTitle,
      savedDescription: t.taskDescription,
    }))
  )

  const [persistedPlan, setPersistedPlan] = React.useState(() => ({
    savedTitle: planDetails.title,
    savedDescription: planDetails.description,
  }))

  const [lastSavedAt, setLastSavedAt] = React.useState<Date>(new Date())
  const [isHydrated, setIsHydrated] = React.useState(false)

  React.useEffect(() => {
    setIsHydrated(true)
  }, [])

  const updateTaskTitle = (index: number, newTitle: string) => {
    setPersisted((p) => {
      console.log("updateTaskTitle", { index, newTitle })
      return p.map((item, i) =>
        i === index ? { ...item, savedTitle: newTitle } : item
      )
    })
    setLastSavedAt(new Date())
  }

  const updateTaskDescription = (index: number, newDescription: string) => {
    setPersisted((p) => {
      console.log("updateTaskDescription", { index, newDescription })
      return p.map((item, i) =>
        i === index ? { ...item, savedDescription: newDescription } : item
      )
    })
    setLastSavedAt(new Date())
  }

  const updatePlanTitle = (newTitle: string) => {
    console.log("updatePlanTitle", { newTitle })
    setPersistedPlan((p) => ({ ...p, savedTitle: newTitle }))
    setLastSavedAt(new Date())
  }

  const updatePlanDescription = (newDescription: string) => {
    console.log("updatePlanDescription", { newDescription })
    setPersistedPlan((p) => ({ ...p, savedDescription: newDescription }))
    setLastSavedAt(new Date())
  }

  const reorderTasks = (fromIndex: number, toIndex: number) => {
    setPersisted((p) => {
      const newPersisted = [...p]
      const [removed] = newPersisted.splice(fromIndex, 1)
      newPersisted.splice(
        toIndex,
        0,
        removed ?? { savedTitle: "", savedDescription: "" }
      )
      return newPersisted
    })
  }

  const handleAddTask = (title: string, description: string) => {
    setPersisted((p) => [
      ...p,
      {
        savedTitle: title,
        savedDescription: description,
      },
    ])
    setLastSavedAt(new Date())
  }

  return (
    <>
      <div className="flex h-screen">
        <div className="flex-1">
          <header className="flex h-14 shrink-0 items-center gap-2">
            <div className="flex flex-1 items-center gap-2 px-3">
              <SidebarTrigger />
              <Separator
                orientation="vertical"
                className="mr-2 data-vertical:h-4 data-vertical:self-auto"
              />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbPage className="line-clamp-1">
                      Project Management & Task Tracking
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            <div className="ml-auto flex items-center gap-4 px-3">
              {isHydrated && (
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  Saved at {format(lastSavedAt, "HH:mm:ss")}
                </div>
              )}
              <RightAiSidebarTrigger />
              <NavActions />
            </div>
          </header>
          <ScrollArea className={"h-[calc(100vh-3.5rem)]"}>
            <div className="flex flex-col px-10 py-8">
              <PlanDetails
                title={persistedPlan.savedTitle}
                description={persistedPlan.savedDescription}
                date={planDetails.dueDate}
                steps={planDetails.steps}
                completion={planDetails.completion}
                onTitleChange={updatePlanTitle}
                onDescriptionChange={updatePlanDescription}
              />

              <TaskList
                tasks={tasks}
                persisted={persisted}
                onReorder={reorderTasks}
                onTitleChange={updateTaskTitle}
                onDescriptionChange={updateTaskDescription}
                onAddTask={handleAddTask}
              />
            </div>
          </ScrollArea>
        </div>
      </div>
    </>
  )
}
