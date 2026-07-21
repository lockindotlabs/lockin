import { currentUser } from "@clerk/nextjs/server"

export async function getCurrentAuthorName() {
  const user = await currentUser()

  const fullName = user?.fullName?.trim()
  if (fullName) {
    return fullName
  }

  const composedName = [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim()
  if (composedName) {
    return composedName
  }

  return user?.primaryEmailAddress?.emailAddress ?? null
}
