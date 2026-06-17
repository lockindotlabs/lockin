import { z } from "zod"
import prisma from "@workspace/db"
import { getAuthenticatedUser } from "@/lib/server/auth"

const UpdateProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
})

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(req: Request, context: RouteContext) {
  const user = await getAuthenticatedUser(req)
  if (!user) {
    return Response.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id } = await context.params
    const project = await prisma.project.findFirst({
      where: { id, userId: user.id },
      include: { plans: { orderBy: { createdAt: "desc" } } },
    })

    if (!project) {
      return Response.json(
        { success: false, error: { message: "Project not found", code: 404 } },
        { status: 404 }
      )
    }

    return Response.json({ success: true, data: project })
  } catch (error) {
    const message = error instanceof Error ? error.message : "An error occurred"
    return Response.json({ success: false, error: { message, code: 500 } }, { status: 500 })
  }
}

export async function PATCH(req: Request, context: RouteContext) {
  const user = await getAuthenticatedUser(req)
  if (!user) {
    return Response.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  try {
    const parsed = UpdateProjectSchema.safeParse(await req.json())
    if (!parsed.success) {
      return Response.json(
        { success: false, error: { message: parsed.error.message, code: 400 } },
        { status: 400 }
      )
    }

    const { id } = await context.params
    const existing = await prisma.project.findFirst({
      where: { id, userId: user.id },
    })

    if (!existing) {
      return Response.json(
        { success: false, error: { message: "Project not found", code: 404 } },
        { status: 404 }
      )
    }

    const project = await prisma.project.update({
      where: { id },
      data: parsed.data,
    })

    return Response.json({ success: true, data: project })
  } catch (error) {
    const message = error instanceof Error ? error.message : "An error occurred"
    return Response.json({ success: false, error: { message, code: 500 } }, { status: 500 })
  }
}

export async function DELETE(req: Request, context: RouteContext) {
  const user = await getAuthenticatedUser(req)
  if (!user) {
    return Response.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id } = await context.params
    const existing = await prisma.project.findFirst({
      where: { id, userId: user.id },
    })

    if (!existing) {
      return Response.json(
        { success: false, error: { message: "Project not found", code: 404 } },
        { status: 404 }
      )
    }

    await prisma.project.delete({ where: { id } })
    return new Response(null, { status: 204 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "An error occurred"
    return Response.json({ success: false, error: { message, code: 500 } }, { status: 500 })
  }
}
