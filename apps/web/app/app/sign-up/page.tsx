import { SignUp } from "@clerk/nextjs"
import { LogoAccent } from "@workspace/ui/components/logo-accent"

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-between bg-background p-12">
      <LogoAccent className="h-9" />
      <div className="mx-auto">
        <SignUp />
      </div>

      <div>
        <span className="text-xs text-muted-foreground">
          By signing up, you agree to our <span>Terms of Service</span> and
          Privacy Policy.
        </span>
      </div>
    </div>
  )
}
