import { LogoLab } from "@/components/logo-lab"

export default function Page() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-neutral-50 px-4 py-8 text-neutral-900 sm:px-6 dark:bg-neutral-900 dark:text-neutral-50">
      <div className="flex w-full max-w-3xl flex-col items-center justify-center self-center">
        <section className="w-full">
          <h1 className="text-lg font-semibold sm:text-xl">
            A little note on LockIn Labs and LockIn
          </h1>
          <div className="mt-3 text-sm leading-relaxed text-neutral-800 sm:text-base dark:text-neutral-300">
            <div className="*:mt-4 *:leading-[150%]">
              <p className="">
                We are announcing that we are winding down LockIn Labs and our
                product LockIn, and we just wanted to say thank you for being
                part of it.
              </p>
              <p className="">
                LockIn started with a simple idea: sometimes the hardest part of
                getting something done is knowing where to start. We built
                LockIn to help turn those overwhelming tasks into smaller steps,
                create a moment to focus, and make it a little easier to go from
                &ldquo;I should do this&rdquo; to &ldquo;I’m doing it.&rdquo;
              </p>
              <p className="">
                Over the course of this project, we have learned a lot from
                building, testing, and seeing how people interacted with LockIn.
                Your feedback, suggestions, and time helped shape the product
                more than you probably realize.
              </p>
              <p className="">
                While this chapter of LockIn is coming to an end, we hope some
                of the ideas behind it stay with you:
              </p>

              <p className="font-semibold!">
                <span>Break it down. Start small. Lock in.</span>
              </p>

              <p className="">
                Thank you for being with us on this journey. It has been the
                honor of a lifetime to build something that we hope made your
                lives a little better, and we look forward to crossing paths
                with you again in the future.
              </p>

              <p className="">Our friends at LockIn Labs.</p>
            </div>
          </div>
        </section>
        <section className="mt-10 w-full border-t border-muted pt-5 sm:mt-12 sm:pt-6">
          <div className="flex flex-row items-center items-start justify-between gap-3">
            <LogoLab className="mt-1 h-[12px] opacity-30" />

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
              <a
                href="https://www.facebook.com/LockInLabs"
                target="_blank"
                rel="noreferrer"
                className="text-muted-foreground transition-colors hover:text-foreground hover:underline focus:text-foreground focus:underline"
              >
                Facebook
              </a>

              <a
                href="mailto:phamanhduyqb@gmail.com"
                className="text-muted-foreground transition-colors hover:text-foreground hover:underline focus:text-foreground focus:underline"
              >
                Contact
              </a>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
