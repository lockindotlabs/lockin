import { SignIn } from "@clerk/nextjs"
import { LogoAccent } from "@workspace/ui/components/logo-accent"
import { LogoWordmark } from "@workspace/ui/components/logo-wordmark"

export default function SignInPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-between bg-background p-12">
      <LogoAccent className="h-9" />
      <div className="mx-auto">
        <SignIn />
      </div>

      <div></div>
    </div>
  )
}
