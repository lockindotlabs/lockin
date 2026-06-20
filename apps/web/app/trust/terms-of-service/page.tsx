"use client"

import { useState, useEffect } from "react"
import { Show } from "@clerk/nextjs"
import { Button } from "@workspace/ui/components/button"
import { LogoAccent } from "@workspace/ui/components/logo-accent"
import Link from "next/link"
import { useTranslation } from "react-i18next"
import { SiteFooter, SiteHeader } from "@/app/page"

export default function TermsOfService() {
  const { t } = useTranslation()
  const [activeSection, setActiveSection] = useState("1-the-service")
  const EMAIL_ADDRESS = "privacy@lockinlabs.online"

  // Scrollspy logic
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: "-10% 0px -75% 0px",
      threshold: 0,
    }

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id)
        }
      })
    }

    const observer = new IntersectionObserver(observerCallback, observerOptions)

    const sections = [
      "1-the-service",
      "2-accounts",
      "3-user-content",
      "4-ai-features",
      "5-productivity-and-focus-features",
      "6-paid-plans-credits-and-billing",
      "7-refunds",
      "8-acceptable-use",
      "9-third-party-services",
      "10-service-availability",
      "11-beta-or-experimental-features",
      "12-intellectual-property",
      "13-feedback",
      "14-termination",
      "15-disclaimers",
      "16-limitation-of-liability",
      "17-indemnification",
      "18-changes-to-these-terms",
      "19-governing-law",
      "20-contact",
    ]

    sections.forEach((id) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })

    return () => {
      observer.disconnect()
    }
  }, [])

  return (
    <>
      <SiteHeader />
      <div className="mx-auto min-h-screen w-full max-w-330 border-x bg-background px-4 pt-12 font-sans text-foreground sm:px-6 md:pt-16 lg:px-10">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-4">
          {/* Sidebar Index Navigation */}
          <aside className="sticky top-24 hidden h-[calc(100vh-8rem)] overflow-y-auto border-r border-border pr-6 lg:col-span-1 lg:block">
            <nav className="flex flex-col space-y-2">
              {[
                { id: "1-the-service", label: t("trust.tos.sections.s1.title") },
                { id: "2-accounts", label: t("trust.tos.sections.s2.title") },
                { id: "3-user-content", label: t("trust.tos.sections.s3.title") },
                { id: "4-ai-features", label: t("trust.tos.sections.s4.title") },
                {
                  id: "5-productivity-and-focus-features",
                  label: t("trust.tos.sections.s5.title"),
                },
                {
                  id: "6-paid-plans-credits-and-billing",
                  label: t("trust.tos.sections.s6.title"),
                },
                { id: "7-refunds", label: t("trust.tos.sections.s7.title") },
                { id: "8-acceptable-use", label: t("trust.tos.sections.s8.title") },
                { id: "9-third-party-services", label: t("trust.tos.sections.s9.title") },
                {
                  id: "10-service-availability",
                  label: t("trust.tos.sections.s10.title"),
                },
                {
                  id: "11-beta-or-experimental-features",
                  label: t("trust.tos.sections.s11.title"),
                },
                {
                  id: "12-intellectual-property",
                  label: t("trust.tos.sections.s12.title"),
                },
                { id: "13-feedback", label: t("trust.tos.sections.s13.title") },
                { id: "14-termination", label: t("trust.tos.sections.s14.title") },
                { id: "15-disclaimers", label: t("trust.tos.sections.s15.title") },
                {
                  id: "16-limitation-of-liability",
                  label: t("trust.tos.sections.s16.title"),
                },
                { id: "17-indemnification", label: t("trust.tos.sections.s17.title") },
                { id: "18-changes-to-these-terms", label: t("trust.tos.sections.s18.title") },
                { id: "19-governing-law", label: t("trust.tos.sections.s19.title") },
                { id: "20-contact", label: t("trust.tos.sections.s20.title") },
              ].map((item, index) => {
                const isActive = activeSection === item.id
                return (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    onClick={(e) => {
                      e.preventDefault()
                      document
                        .getElementById(item.id)
                        ?.scrollIntoView({ behavior: "smooth" })
                      setActiveSection(item.id)
                    }}
                    className={`truncate text-left text-xs leading-5 transition-colors ${
                      isActive
                        ? "-ml-3 border-l-2 border-primary pl-3 font-semibold text-foreground"
                        : "pl-0 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {index + 1}. {item.label}
                  </a>
                )
              })}
            </nav>
          </aside>

          {/* Main Document Content */}
          <main className="col-span-1 max-w-3xl text-sm leading-relaxed text-muted-foreground lg:col-span-3">
            <h1 className="mb-2 font-sans-tight text-3xl font-bold text-foreground">
              {t("trust.tos.title")}
            </h1>
            <p className="mb-8 text-xs text-muted-foreground">
              {t("trust.lastUpdated")}
            </p>

            <p className="mb-6 text-foreground/90">{t("trust.tos.welcome")}</p>
            <p className="mb-10 text-foreground/90">
              {t("trust.tos.intro")}
            </p>

            {/* Section 1 */}
            <section id="1-the-service" className="mb-12 scroll-mt-24">
              <h2 className="mb-4 border-b pb-2 font-sans-tight text-xl font-bold text-foreground">
                1. {t("trust.tos.sections.s1.title")}
              </h2>
              {Array.isArray(t("trust.tos.sections.s1.items", { returnObjects: true })) &&
                (t("trust.tos.sections.s1.items", { returnObjects: true }) as string[]).map((item, i) => (
                  <p key={i} className="mb-4">
                    {item}
                  </p>
                ))}
            </section>

            {/* Section 2 */}
            <section id="2-accounts" className="mb-12 scroll-mt-24">
              <h2 className="mb-4 border-b pb-2 font-sans-tight text-xl font-bold text-foreground">
                2. {t("trust.tos.sections.s2.title")}
              </h2>
              <p className="mb-4">
                {t("trust.tos.sections.s2.p1")}
              </p>
              <p className="mb-4">{t("trust.tos.sections.s2.subtitle")}</p>
              <ul className="mb-4 list-disc space-y-1.5 pl-5">
                {Array.isArray(t("trust.tos.sections.s2.items", { returnObjects: true })) &&
                  (t("trust.tos.sections.s2.items", { returnObjects: true }) as string[]).map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
              </ul>
              <p className="mb-4">
                {t("trust.tos.sections.s2.p2")}
              </p>
            </section>

            {/* Section 3 */}
            <section id="3-user-content" className="mb-12 scroll-mt-24">
              <h2 className="mb-4 border-b pb-2 font-sans-tight text-xl font-bold text-foreground">
                3. {t("trust.tos.sections.s3.title")}
              </h2>
              {Array.isArray(t("trust.tos.sections.s3.items", { returnObjects: true })) &&
                (t("trust.tos.sections.s3.items", { returnObjects: true }) as string[]).map((item, i) => (
                  <p key={i} className="mb-4">
                    {item}
                  </p>
                ))}
            </section>

            {/* Section 4 */}
            <section id="4-ai-features" className="mb-12 scroll-mt-24">
              <h2 className="mb-4 border-b pb-2 font-sans-tight text-xl font-bold text-foreground">
                4. {t("trust.tos.sections.s4.title")}
              </h2>
              {Array.isArray(t("trust.tos.sections.s4.items", { returnObjects: true })) &&
                (t("trust.tos.sections.s4.items", { returnObjects: true }) as string[]).map((item, i) => (
                  <p key={i} className="mb-4">
                    {item}
                  </p>
                ))}
            </section>

            {/* Section 5 */}
            <section
              id="5-productivity-and-focus-features"
              className="mb-12 scroll-mt-24"
            >
              <h2 className="mb-4 border-b pb-2 font-sans-tight text-xl font-bold text-foreground">
                5. {t("trust.tos.sections.s5.title")}
              </h2>
              {Array.isArray(t("trust.tos.sections.s5.items", { returnObjects: true })) &&
                (t("trust.tos.sections.s5.items", { returnObjects: true }) as string[]).map((item, i) => (
                  <p key={i} className="mb-4">
                    {item}
                  </p>
                ))}
            </section>

            {/* Section 6 */}
            <section
              id="6-paid-plans-credits-and-billing"
              className="mb-12 scroll-mt-24"
            >
              <h2 className="mb-4 border-b pb-2 font-sans-tight text-xl font-bold text-foreground">
                6. {t("trust.tos.sections.s6.title")}
              </h2>
              <p className="mb-4">
                {t("trust.tos.sections.s6.p1")}
              </p>
              <p className="mb-2">{t("trust.tos.sections.s6.subtitle")}</p>
              <ul className="mb-4 list-disc space-y-1.5 pl-5">
                {Array.isArray(t("trust.tos.sections.s6.items", { returnObjects: true })) &&
                  (t("trust.tos.sections.s6.items", { returnObjects: true }) as string[]).map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
              </ul>
              <p className="mb-4">
                {t("trust.tos.sections.s6.p2")}
              </p>
              <p className="mb-4">
                {t("trust.tos.sections.s6.p3")}
              </p>
              <p className="mb-4">
                {t("trust.tos.sections.s6.p4")}
              </p>
              <p className="mb-4">
                {t("trust.tos.sections.s6.p5")}
              </p>
              <p className="mb-4">
                {t("trust.tos.sections.s6.p6")}
              </p>
            </section>

            {/* Section 7 */}
            <section id="7-refunds" className="mb-12 scroll-mt-24">
              <h2 className="mb-4 border-b pb-2 font-sans-tight text-xl font-bold text-foreground">
                7. {t("trust.tos.sections.s7.title")}
              </h2>
              <p className="mb-4">
                {t("trust.tos.sections.s7.p1")}
              </p>
              <p className="mb-4 font-semibold text-foreground">
                {t("trust.tos.sections.s7.p2")}
              </p>
              <p className="mb-4">
                {t("trust.tos.sections.s7.p3")}
              </p>
            </section>

            {/* Section 8 */}
            <section id="8-acceptable-use" className="mb-12 scroll-mt-24">
              <h2 className="mb-4 border-b pb-2 font-sans-tight text-xl font-bold text-foreground">
                8. {t("trust.tos.sections.s8.title")}
              </h2>
              <p className="mb-4">{t("trust.tos.sections.s8.subtitle")}</p>
              <ul className="mb-4 list-disc space-y-1.5 pl-5">
                {Array.isArray(t("trust.tos.sections.s8.items", { returnObjects: true })) &&
                  (t("trust.tos.sections.s8.items", { returnObjects: true }) as string[]).map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
              </ul>
              <p className="mb-4">
                {t("trust.tos.sections.s8.p1")}
              </p>
            </section>

            {/* Section 9 */}
            <section id="9-third-party-services" className="mb-12 scroll-mt-24">
              <h2 className="mb-4 border-b pb-2 font-sans-tight text-xl font-bold text-foreground">
                9. {t("trust.tos.sections.s9.title")}
              </h2>
              {Array.isArray(t("trust.tos.sections.s9.items", { returnObjects: true })) &&
                (t("trust.tos.sections.s9.items", { returnObjects: true }) as string[]).map((item, i) => (
                  <p key={i} className="mb-4">
                    {item}
                  </p>
                ))}
            </section>

            {/* Section 10 */}
            <section
              id="10-service-availability"
              className="mb-12 scroll-mt-24"
            >
              <h2 className="mb-4 border-b pb-2 font-sans-tight text-xl font-bold text-foreground">
                10. {t("trust.tos.sections.s10.title")}
              </h2>
              {Array.isArray(t("trust.tos.sections.s10.items", { returnObjects: true })) &&
                (t("trust.tos.sections.s10.items", { returnObjects: true }) as string[]).map((item, i) => (
                  <p key={i} className="mb-4">
                    {item}
                  </p>
                ))}
            </section>

            {/* Section 11 */}
            <section
              id="11-beta-or-experimental-features"
              className="mb-12 scroll-mt-24"
            >
              <h2 className="mb-4 border-b pb-2 font-sans-tight text-xl font-bold text-foreground">
                11. {t("trust.tos.sections.s11.title")}
              </h2>
              {Array.isArray(t("trust.tos.sections.s11.items", { returnObjects: true })) &&
                (t("trust.tos.sections.s11.items", { returnObjects: true }) as string[]).map((item, i) => (
                  <p key={i} className="mb-4">
                    {item}
                  </p>
                ))}
            </section>

            {/* Section 12 */}
            <section
              id="12-intellectual-property"
              className="mb-12 scroll-mt-24"
            >
              <h2 className="mb-4 border-b pb-2 font-sans-tight text-xl font-bold text-foreground">
                12. {t("trust.tos.sections.s12.title")}
              </h2>
              {Array.isArray(t("trust.tos.sections.s12.items", { returnObjects: true })) &&
                (t("trust.tos.sections.s12.items", { returnObjects: true }) as string[]).map((item, i) => (
                  <p key={i} className="mb-4">
                    {item}
                  </p>
                ))}
            </section>

            {/* Section 13 */}
            <section id="13-feedback" className="mb-12 scroll-mt-24">
              <h2 className="mb-4 border-b pb-2 font-sans-tight text-xl font-bold text-foreground">
                13. {t("trust.tos.sections.s13.title")}
              </h2>
              {Array.isArray(t("trust.tos.sections.s13.items", { returnObjects: true })) &&
                (t("trust.tos.sections.s13.items", { returnObjects: true }) as string[]).map((item, i) => (
                  <p key={i} className="mb-4">
                    {item}
                  </p>
                ))}
            </section>

            {/* Section 14 */}
            <section id="14-termination" className="mb-12 scroll-mt-24">
              <h2 className="mb-4 border-b pb-2 font-sans-tight text-xl font-bold text-foreground">
                14. {t("trust.tos.sections.s14.title")}
              </h2>
              <p className="mb-4">{t("trust.tos.sections.s14.p1")}</p>
              <p className="mb-4">{t("trust.tos.sections.s14.subtitle")}</p>
              <ul className="mb-4 list-disc space-y-1.5 pl-5">
                {Array.isArray(t("trust.tos.sections.s14.items", { returnObjects: true })) &&
                  (t("trust.tos.sections.s14.items", { returnObjects: true }) as string[]).map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
              </ul>
              <p className="mb-4">
                {t("trust.tos.sections.s14.p2")}
              </p>
            </section>

            {/* Section 15 */}
            <section id="15-disclaimers" className="mb-12 scroll-mt-24">
              <h2 className="mb-4 border-b pb-2 font-sans-tight text-xl font-bold text-foreground">
                15. {t("trust.tos.sections.s15.title")}
              </h2>
              <p className="mb-4">
                {t("trust.tos.sections.s15.p1")}
              </p>
              <p className="mb-4">
                {t("trust.tos.sections.s15.p2")}
              </p>
              <p className="mb-4">{t("trust.tos.sections.s15.subtitle")}</p>
              <ul className="mb-4 list-disc space-y-1.5 pl-5">
                {Array.isArray(t("trust.tos.sections.s15.items", { returnObjects: true })) &&
                  (t("trust.tos.sections.s15.items", { returnObjects: true }) as string[]).map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
              </ul>
            </section>

            {/* Section 16 */}
            <section
              id="16-limitation-of-liability"
              className="mb-12 scroll-mt-24"
            >
              <h2 className="mb-4 border-b pb-2 font-sans-tight text-xl font-bold text-foreground">
                16. {t("trust.tos.sections.s16.title")}
              </h2>
              {Array.isArray(t("trust.tos.sections.s16.items", { returnObjects: true })) &&
                (t("trust.tos.sections.s16.items", { returnObjects: true }) as string[]).map((item, i) => (
                  <p key={i} className="mb-4">
                    {item}
                  </p>
                ))}
            </section>

            {/* Section 17 */}
            <section id="17-indemnification" className="mb-12 scroll-mt-24">
              <h2 className="mb-4 border-b pb-2 font-sans-tight text-xl font-bold text-foreground">
                17. {t("trust.tos.sections.s17.title")}
              </h2>
              <p className="mb-4">
                {t("trust.tos.sections.s17.subtitle")}
              </p>
              <ul className="mb-4 list-disc space-y-1.5 pl-5">
                {Array.isArray(t("trust.tos.sections.s17.items", { returnObjects: true })) &&
                  (t("trust.tos.sections.s17.items", { returnObjects: true }) as string[]).map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
              </ul>
            </section>

            {/* Section 18 */}
            <section
              id="18-changes-to-these-terms"
              className="mb-12 scroll-mt-24"
            >
              <h2 className="mb-4 border-b pb-2 font-sans-tight text-xl font-bold text-foreground">
                18. {t("trust.tos.sections.s18.title")}
              </h2>
              {Array.isArray(t("trust.tos.sections.s18.items", { returnObjects: true })) &&
                (t("trust.tos.sections.s18.items", { returnObjects: true }) as string[]).map((item, i) => (
                  <p key={i} className="mb-4">
                    {item}
                  </p>
                ))}
            </section>

            {/* Section 19 */}
            <section id="19-governing-law" className="mb-12 scroll-mt-24">
              <h2 className="mb-4 border-b pb-2 font-sans-tight text-xl font-bold text-foreground">
                19. {t("trust.tos.sections.s19.title")}
              </h2>
              {Array.isArray(t("trust.tos.sections.s19.items", { returnObjects: true })) &&
                (t("trust.tos.sections.s19.items", { returnObjects: true }) as string[]).map((item, i) => (
                  <p key={i} className="mb-4">
                    {item}
                  </p>
                ))}
            </section>

            {/* Section 20 */}
            <section id="20-contact" className="mb-12 scroll-mt-24">
              <h2 className="mb-4 border-b pb-2 font-sans-tight text-xl font-bold text-foreground">
                20. {t("trust.tos.sections.s20.title")}
              </h2>
              <p className="mb-4">
                {t("trust.tos.sections.s20.subtitle")}
              </p>
              <div className="max-w-md space-y-1 rounded-md border border-border bg-muted/20 p-5 text-sm text-foreground">
                <p className="font-semibold">{t("trust.tos.sections.s20.company")}</p>
                <p>
                  <a href={`mailto:${EMAIL_ADDRESS}`} className="underline">
                    {EMAIL_ADDRESS}
                  </a>
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("trust.tos.sections.s20.address")}
                </p>
              </div>
            </section>
          </main>
        </div>
      </div>
      <SiteFooter />
    </>
  )
}
