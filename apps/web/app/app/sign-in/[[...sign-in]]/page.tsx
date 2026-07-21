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
import Link from "next/link"

export default function SignInPage() {
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
          <SignIn path="/app/sign-in" />
          <ClerkDegraded>
            <DegradedState />
          </ClerkDegraded>
        </ClerkLoaded>
        <ClerkFailed>
          <FailedState />
        </ClerkFailed>
      </div>
      <p className="max-w-sm text-center text-xs text-muted-foreground">
        By continuing, you acknowledge that you understand and agree to the{" "}
        <Link href="/trust/terms-of-service" className="underline">
          Terms & Conditions
        </Link>{" "}
        and{" "}
        <Link href="/trust/privacy-policy" className="underline">
          Privacy Policy
        </Link>
      </p>
    </div>
  )
}
