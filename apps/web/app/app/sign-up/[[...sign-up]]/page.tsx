import {
  DegradedState,
  FailedState,
  LoadingState,
} from "@/components/clerk-loading-states"
import {
  ClerkDegraded,
  ClerkFailed,
  ClerkLoaded,
  ClerkLoading,
  SignUp,
} from "@clerk/nextjs"
import { LogoAccent } from "@workspace/ui/components/logo-accent"
import Link from "next/link"

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-between bg-background py-12">
      <Link href="/">
        <LogoAccent className="h-9" />
      </Link>
      <div className="mx-auto">
        <ClerkLoading>
          <LoadingState />
        </ClerkLoading>
        <ClerkLoaded>
          <SignUp path="/app/sign-up" />
          <ClerkDegraded>
            <DegradedState />
          </ClerkDegraded>
        </ClerkLoaded>
        <ClerkFailed>
          <FailedState />
        </ClerkFailed>
      </div>

      <p className="max-w-sm text-center text-xs text-muted-foreground">
        By continuing, you acknowledge that you understand and agree to the
        Terms & Conditions and Privacy Policy
      </p>
    </div>
  )
}
