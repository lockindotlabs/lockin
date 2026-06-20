"use client"

import { useState, useEffect } from "react"
import { Show } from "@clerk/nextjs"
import { Button } from "@workspace/ui/components/button"
import { LogoAccent } from "@workspace/ui/components/logo-accent"
import Link from "next/link"
import { useTranslation } from "react-i18next"
import {
  AppLocale,
  getLocaleDisplayName,
  I18N_COOKIE_NAME,
  SUPPORTED_LOCALES,
} from "@workspace/i18n"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { ChevronDown, LanguagesIcon } from "lucide-react"
import { LogoLab } from "@/components/logo-lab"
import { useRouter } from "next/navigation"
import { SiteFooter, SiteHeader } from "@/app/page"

export default function PrivacyPolicy() {
  const { t } = useTranslation()
  const [activeSection, setActiveSection] = useState("1-information-we-collect")
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
      "1-information-we-collect",
      "2-how-we-use-information",
      "3-ai-processing",
      "4-third-party-services",
      "5-cookies-and-tracking",
      "6-data-sharing",
      "7-data-retention",
      "8-data-security",
      "9-your-rights-and-choices",
      "10-childrens-privacy",
      "11-international-users",
      "12-changes-to-this-policy",
      "13-contact-us",
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
                {
                  id: "1-information-we-collect",
                  label: t("trust.privacy.sections.s1.title"),
                },
                {
                  id: "2-how-we-use-information",
                  label: t("trust.privacy.sections.s2.title"),
                },
                { id: "3-ai-processing", label: t("trust.privacy.sections.s3.title") },
                {
                  id: "4-third-party-services",
                  label: t("trust.privacy.sections.s4.title"),
                },
                {
                  id: "5-cookies-and-tracking",
                  label: t("trust.privacy.sections.s5.title"),
                },
                { id: "6-data-sharing", label: t("trust.privacy.sections.s6.title") },
                { id: "7-data-retention", label: t("trust.privacy.sections.s7.title") },
                { id: "8-data-security", label: t("trust.privacy.sections.s8.title") },
                {
                  id: "9-your-rights-and-choices",
                  label: t("trust.privacy.sections.s9.title"),
                },
                { id: "10-childrens-privacy", label: t("trust.privacy.sections.s10.title") },
                {
                  id: "11-international-users",
                  label: t("trust.privacy.sections.s11.title"),
                },
                {
                  id: "12-changes-to-this-policy",
                  label: t("trust.privacy.sections.s12.title"),
                },
                { id: "13-contact-us", label: t("trust.privacy.sections.s13.title") },
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
              {t("trust.privacy.title")}
            </h1>
            <p className="mb-8 text-xs text-muted-foreground">
              {t("trust.lastUpdated")}
            </p>

            <p className="mb-6 text-foreground/90">
              {t("trust.privacy.intro1")}
            </p>
            <p className="mb-10 text-foreground/90">
              {t("trust.privacy.intro2")}
            </p>

            {/* Section 1 */}
            <section
              id="1-information-we-collect"
              className="mb-12 scroll-mt-24"
            >
              <h2 className="mb-4 border-b pb-2 font-sans-tight text-xl font-bold text-foreground">
                1. {t("trust.privacy.sections.s1.title")}
              </h2>
              <p className="mb-4">
                {t("trust.privacy.sections.s1.subtitle")}
              </p>

              <h3 className="mt-6 mb-2 text-sm font-semibold text-foreground">
                {t("trust.privacy.sections.s1.account.title")}
              </h3>
              <p className="mb-2">
                {t("trust.privacy.sections.s1.account.subtitle")}
              </p>
              <ul className="mb-6 list-disc space-y-1.5 pl-5">
                {Array.isArray(t("trust.privacy.sections.s1.account.items", { returnObjects: true })) &&
                  (t("trust.privacy.sections.s1.account.items", { returnObjects: true }) as string[]).map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
              </ul>

              <h3 className="mt-6 mb-2 text-sm font-semibold text-foreground">
                {t("trust.privacy.sections.s1.task.title")}
              </h3>
              <p className="mb-2">
                {t("trust.privacy.sections.s1.task.subtitle")}
              </p>
              <ul className="mb-6 list-disc space-y-1.5 pl-5">
                {Array.isArray(t("trust.privacy.sections.s1.task.items", { returnObjects: true })) &&
                  (t("trust.privacy.sections.s1.task.items", { returnObjects: true }) as string[]).map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
              </ul>

              <h3 className="mt-6 mb-2 text-sm font-semibold text-foreground">
                {t("trust.privacy.sections.s1.ai.title")}
              </h3>
              <p className="mb-2">
                {t("trust.privacy.sections.s1.ai.subtitle")}
              </p>
              <ul className="mb-2 list-disc space-y-1.5 pl-5">
                {Array.isArray(t("trust.privacy.sections.s1.ai.items", { returnObjects: true })) &&
                  (t("trust.privacy.sections.s1.ai.items", { returnObjects: true }) as string[]).map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
              </ul>
              <p className="mb-6 text-xs text-muted-foreground/80 italic">
                {t("trust.privacy.sections.s1.ai.note")}
              </p>

              <h3 className="mt-6 mb-2 text-sm font-semibold text-foreground">
                {t("trust.privacy.sections.s1.blocking.title")}
              </h3>
              <p className="mb-2">
                {t("trust.privacy.sections.s1.blocking.subtitle")}
              </p>
              <ul className="mb-6 list-disc space-y-1.5 pl-5">
                {Array.isArray(t("trust.privacy.sections.s1.blocking.items", { returnObjects: true })) &&
                  (t("trust.privacy.sections.s1.blocking.items", { returnObjects: true }) as string[]).map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
              </ul>

              <h3 className="mt-6 mb-2 text-sm font-semibold text-foreground">
                {t("trust.privacy.sections.s1.usage.title")}
              </h3>
              <p className="mb-2">
                {t("trust.privacy.sections.s1.usage.subtitle")}
              </p>
              <ul className="mb-6 list-disc space-y-1.5 pl-5">
                {Array.isArray(t("trust.privacy.sections.s1.usage.items", { returnObjects: true })) &&
                  (t("trust.privacy.sections.s1.usage.items", { returnObjects: true }) as string[]).map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
              </ul>

              <h3 className="mt-6 mb-2 text-sm font-semibold text-foreground">
                {t("trust.privacy.sections.s1.payment.title")}
              </h3>
              <p className="mb-4">
                {t("trust.privacy.sections.s1.payment.p1")}
              </p>
            </section>

            {/* Section 2 */}
            <section
              id="2-how-we-use-information"
              className="mb-12 scroll-mt-24"
            >
              <h2 className="mb-4 border-b pb-2 font-sans-tight text-xl font-bold text-foreground">
                2. {t("trust.privacy.sections.s2.title")}
              </h2>
              <p className="mb-4">{t("trust.privacy.sections.s2.subtitle")}</p>
              <ul className="mb-6 list-disc space-y-1.5 pl-5">
                {Array.isArray(t("trust.privacy.sections.s2.items", { returnObjects: true })) &&
                  (t("trust.privacy.sections.s2.items", { returnObjects: true }) as string[]).map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
              </ul>
            </section>

            {/* Section 3 */}
            <section id="3-ai-processing" className="mb-12 scroll-mt-24">
              <h2 className="mb-4 border-b pb-2 font-sans-tight text-xl font-bold text-foreground">
                3. {t("trust.privacy.sections.s3.title")}
              </h2>
              <p className="mb-4">
                {t("trust.privacy.sections.s3.p1")}
              </p>
              <p className="mb-4">
                {t("trust.privacy.sections.s3.p2")}
              </p>
              <p className="mb-6">
                {t("trust.privacy.sections.s3.p3")}
              </p>
            </section>

            {/* Section 4 */}
            <section id="4-third-party-services" className="mb-12 scroll-mt-24">
              <h2 className="mb-4 border-b pb-2 font-sans-tight text-xl font-bold text-foreground">
                4. {t("trust.privacy.sections.s4.title")}
              </h2>
              <p className="mb-4">
                {t("trust.privacy.sections.s4.p1")}
              </p>
              <p className="mb-4">
                {t("trust.privacy.sections.s4.p2")}
              </p>
              <ul className="mb-6 list-disc space-y-1.5 pl-5">
                {Array.isArray(t("trust.privacy.sections.s4.services", { returnObjects: true })) &&
                  (t("trust.privacy.sections.s4.services", { returnObjects: true }) as string[]).map((item, i) => (
                    <li key={i} dangerouslySetInnerHTML={{ __html: item }} />
                  ))}
              </ul>
            </section>

            {/* Section 5 */}
            <section id="5-cookies-and-tracking" className="mb-12 scroll-mt-24">
              <h2 className="mb-4 border-b pb-2 font-sans-tight text-xl font-bold text-foreground">
                5. {t("trust.privacy.sections.s5.title")}
              </h2>
              <p className="mb-4">
                {t("trust.privacy.sections.s5.subtitle")}
              </p>
              <ul className="mb-4 list-disc space-y-1.5 pl-5">
                {Array.isArray(t("trust.privacy.sections.s5.items", { returnObjects: true })) &&
                  (t("trust.privacy.sections.s5.items", { returnObjects: true }) as string[]).map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
              </ul>
              <p className="mb-6">
                {t("trust.privacy.sections.s5.p1")}
              </p>
            </section>

            {/* Section 6 */}
            <section id="6-data-sharing" className="mb-12 scroll-mt-24">
              <h2 className="mb-4 border-b pb-2 font-sans-tight text-xl font-bold text-foreground">
                6. {t("trust.privacy.sections.s6.title")}
              </h2>
              <p className="mb-4">{t("trust.privacy.sections.s6.p1")}</p>
              <p className="mb-4">{t("trust.privacy.sections.s6.p2")}</p>
              <ul className="mb-6 list-disc space-y-1.5 pl-5">
                {Array.isArray(t("trust.privacy.sections.s6.items", { returnObjects: true })) &&
                  (t("trust.privacy.sections.s6.items", { returnObjects: true }) as string[]).map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
              </ul>
            </section>

            {/* Section 7 */}
            <section id="7-data-retention" className="mb-12 scroll-mt-24">
              <h2 className="mb-4 border-b pb-2 font-sans-tight text-xl font-bold text-foreground">
                7. {t("trust.privacy.sections.s7.title")}
              </h2>
              <p className="mb-4">
                {t("trust.privacy.sections.s7.p1")}
              </p>
              <p className="mb-4">
                {t("trust.privacy.sections.s7.p2", { email: EMAIL_ADDRESS })}
              </p>
              <p className="mb-6">
                {t("trust.privacy.sections.s7.p3")}
              </p>
            </section>

            {/* Section 8 */}
            <section id="8-data-security" className="mb-12 scroll-mt-24">
              <h2 className="mb-4 border-b pb-2 font-sans-tight text-xl font-bold text-foreground">
                8. {t("trust.privacy.sections.s8.title")}
              </h2>
              <p className="mb-4">
                {t("trust.privacy.sections.s8.p1")}
              </p>
              <p className="mb-6">
                {t("trust.privacy.sections.s8.p2")}
              </p>
            </section>

            {/* Section 9 */}
            <section
              id="9-your-rights-and-choices"
              className="mb-12 scroll-mt-24"
            >
              <h2 className="mb-4 border-b pb-2 font-sans-tight text-xl font-bold text-foreground">
                9. {t("trust.privacy.sections.s9.title")}
              </h2>
              <p className="mb-4">
                {t("trust.privacy.sections.s9.subtitle")}
              </p>
              <ul className="mb-4 list-disc space-y-1.5 pl-5">
                {Array.isArray(t("trust.privacy.sections.s9.items", { returnObjects: true })) &&
                  (t("trust.privacy.sections.s9.items", { returnObjects: true }) as string[]).map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
              </ul>
              <p className="mb-6">
                {t("trust.privacy.sections.s9.p1", { email: EMAIL_ADDRESS })}
              </p>
            </section>

            {/* Section 10 */}
            <section id="10-childrens-privacy" className="mb-12 scroll-mt-24">
              <h2 className="mb-4 border-b pb-2 font-sans-tight text-xl font-bold text-foreground">
                10. {t("trust.privacy.sections.s10.title")}
              </h2>
              <p className="mb-4">
                {t("trust.privacy.sections.s10.p1")}
              </p>
            </section>

            {/* Section 11 */}
            <section id="11-international-users" className="mb-12 scroll-mt-24">
              <h2 className="mb-4 border-b pb-2 font-sans-tight text-xl font-bold text-foreground">
                11. {t("trust.privacy.sections.s11.title")}
              </h2>
              <p className="mb-4">
                {t("trust.privacy.sections.s11.p1")}
              </p>
              <p className="mb-6">
                {t("trust.privacy.sections.s11.p2")}
              </p>
            </section>

            {/* Section 12 */}
            <section
              id="12-changes-to-this-policy"
              className="mb-12 scroll-mt-24"
            >
              <h2 className="mb-4 border-b pb-2 font-sans-tight text-xl font-bold text-foreground">
                12. {t("trust.privacy.sections.s12.title")}
              </h2>
              <p className="mb-6">
                {t("trust.privacy.sections.s12.p1")}
              </p>
            </section>

            {/* Section 13 */}
            <section id="13-contact-us" className="mb-12 scroll-mt-24">
              <h2 className="mb-4 border-b pb-2 font-sans-tight text-xl font-bold text-foreground">
                13. {t("trust.privacy.sections.s13.title")}
              </h2>
              <p className="mb-4">
                {t("trust.privacy.sections.s13.subtitle")}
              </p>
              <div className="max-w-md space-y-1 rounded-md border border-border bg-muted/20 p-5 text-sm text-foreground">
                <p className="font-semibold">{t("trust.privacy.sections.s13.company")}</p>
                <p>
                  <a href={`mailto:${EMAIL_ADDRESS}`} className="underline">
                    {EMAIL_ADDRESS}
                  </a>
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("trust.privacy.sections.s13.address")}
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
