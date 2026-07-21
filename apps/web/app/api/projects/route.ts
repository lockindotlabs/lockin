import { z } from "zod"
import prisma from "@workspace/db"
import { getAuthenticatedUser } from "@/lib/server/auth"

const CreateProjectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
})

export async function GET(req: Request) {
  const user = await getAuthenticatedUser(req)
  if (!user) {
    return Response.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  try {
    const projects = await prisma.project.findMany({
      where: { userId: user.id },
      include: { _count: { select: { plans: true } } },
      orderBy: { createdAt: "desc" },
    })
    return Response.json({ success: true, data: projects })
  } catch (error) {
    const message = error instanceof Error ? error.message : "An error occurred"
    return Response.json({ success: false, error: { message, code: 500 } }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const user = await getAuthenticatedUser(req)
  if (!user) {
    return Response.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  try {
    const parsed = CreateProjectSchema.safeParse(await req.json())
    if (!parsed.success) {
      return Response.json(
        { success: false, error: { message: parsed.error.message, code: 400 } },
        { status: 400 }
      )
    }

    const project = await prisma.project.create({
      data: { userId: user.id, ...parsed.data },
    })
    return Response.json({ success: true, message: "Project created", data: project }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "An error occurred"
    return Response.json({ success: false, error: { message, code: 500 } }, { status: 500 })
  }
}
