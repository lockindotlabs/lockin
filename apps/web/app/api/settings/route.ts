import { z } from "zod"
import prisma from "@workspace/db"
import { getAuthenticatedUser } from "@/lib/server/auth"
import {
  DEFAULT_LOCALE,
  I18N_COOKIE_NAME,
  SUPPORTED_LOCALES,
} from "@workspace/i18n"

const HUD_STYLES = ["tiny", "pill+ring", "card", "off"] as const
const REMINDER_STYLES = ["banner", "modal", "toast", "justify"] as const
const BLOCK_TONES = ["calm", "accountability", "gamified", "stark"] as const
const POPUP_VIEWS = ["compact", "standard", "roomy"] as const

const UpdateSettingsSchema = z.object({
  theme: z.enum(["light", "dark", "system"]).optional(),
  language: z.enum(SUPPORTED_LOCALES).optional(),
  blocklistHard: z.array(z.string()).optional(),
  blocklistSoft: z.array(z.string()).optional(),
  hudStyle: z.enum(HUD_STYLES).optional(),
  reminderStyle: z.enum(REMINDER_STYLES).optional(),
  blockTone: z.enum(BLOCK_TONES).optional(),
  popupView: z.enum(POPUP_VIEWS).optional(),
  defaultDuration: z.number().int().min(1).max(480).optional(),
  tabGuard: z.boolean().optional(),
})

export async function GET(req: Request) {
  const user = await getAuthenticatedUser(req)
  if (!user) {
    return Response.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    )
  }

  try {
    const settings = await prisma.userSettings.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id, language: DEFAULT_LOCALE },
    })
    return Response.json({ success: true, data: settings })
  } catch (error) {
    const message = error instanceof Error ? error.message : "An error occurred"
    return Response.json(
      { success: false, error: { message, code: 500 } },
      { status: 500 }
    )
  }
}

export async function PATCH(req: Request) {
  const user = await getAuthenticatedUser(req)
  if (!user) {
    return Response.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    )
  }

  try {
    const parsed = UpdateSettingsSchema.safeParse(await req.json())
    if (!parsed.success) {
      return Response.json(
        { success: false, error: { message: parsed.error.message, code: 400 } },
        { status: 400 }
      )
    }

    const settings = await prisma.userSettings.upsert({
      where: { userId: user.id },
      update: parsed.data,
      create: { userId: user.id, language: DEFAULT_LOCALE, ...parsed.data },
    })
    const response = Response.json({ success: true, data: settings })

    if (parsed.data.language) {
      response.headers.append(
        "Set-Cookie",
        `${I18N_COOKIE_NAME}=${parsed.data.language}; Path=/; Max-Age=31536000; SameSite=Lax`
      )
    }

    return response
  } catch (error) {
    const message = error instanceof Error ? error.message : "An error occurred"
    return Response.json(
      { success: false, error: { message, code: 500 } },
      { status: 500 }
    )
  }
}
