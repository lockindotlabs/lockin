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
  SignIn,
} from "@clerk/nextjs"
import { LogoAccent } from "@workspace/ui/components/logo-accent"

export default function SignInPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-between bg-background p-12">
      <LogoAccent className="h-9" />
      <ClerkLoading>
        <LoadingState />
      </ClerkLoading>
      <ClerkLoaded>
        <SignIn path="/app/sign-in" />
        <ClerkDegraded>
          <DegradedState />
        </ClerkDegraded>
      </ClerkLoaded>
      <ClerkFailed>
        <FailedState />
      </ClerkFailed>
      <p className="max-w-sm text-center text-xs text-muted-foreground">
        By continuing, you acknowledge that you understand and agree to the
        Terms & Conditions and Privacy Policy
      </p>
    </div>
  )
}
