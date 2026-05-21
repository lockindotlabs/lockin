import Link from "next/link"
import {
  Presentation,
  Palette,
  CodeXml,
  BookOpenCheck,
  SquareCheckBig,
  Languages,
  LanguagesIcon,
  ChevronDown,
} from "lucide-react"
import { LogoAccent } from "@workspace/ui/components/logo-accent"
import { Show } from "@clerk/nextjs"
import { Button } from "@workspace/ui/components/button"
import { HeroInput } from "@/components/hero-input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"

const suggestionChips = [
  { icon: Presentation, label: "Chuẩn bị cho bài thuyết trình" },
  { icon: Palette, label: "Sản xuất phim hoạt hình ngắn" },
  { icon: CodeXml, label: "Thực hiện một dự án cá nhân" },
  { icon: BookOpenCheck, label: "Viết tiểu luận" },
]

const freePlanFeatures = [
  "Luôn có một lựa chọn phù hợp với bạn.",
  "Luôn có một lựa chọn phù hợp với bạn.",
  "Luôn có một lựa chọn phù hợp với bạn.",
  "Luôn có một lựa chọn phù hợp với bạn.",
]

const paidPlanFeatures = [
  "Luôn có một lựa chọn phù hợp với bạn.",
  "Luôn có một lựa chọn phù hợp với bạn.",
  "Luôn có một lựa chọn phù hợp với bạn.",
]

const footerLinks: Record<string, string[]> = {
  "Công ty": [
    "Giới thiệu về chúng tôi",
    "Cơ hội nghề nghiệp",
    "Bảo mật",
    "Điều khoản và quyền riêng tư",
    "Liên hệ",
  ],
  "Tài nguyên": ["Bảng giá", "Cộng đồng", "FAQ", "Trung tâm trợ giúp"],
  "LockIn cho": ["Trường học", "Cá nhân", "Doanh nghiệp"],
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-[#281b01]">
      <Navbar />
      <main>
        <HeroSection />
        <TimeSection />
        <FeaturesSection />
        <PricingSection />
      </main>
      <Footer />
    </div>
  )
}

function Navbar() {
  return (
    <header className="sticky top-0 z-50 bg-white">
      <div className="relative mx-auto flex h-16 max-w-360 items-center justify-between px-27.5">
        <Link href="/" aria-label="LockIn">
          <LogoAccent className="h-9" />
        </Link>

        <nav className="absolute left-1/2 flex -translate-x-1/2 items-center gap-6">
          {(
            [
              ["#gioi-thieu", "Giới thiệu"],
              ["#tinh-nang", "Tính năng"],
              ["#bang-gia", "Bảng giá"],
              ["#tai-xuong", "Tải xuống"],
            ] as const
          ).map(([href, label]) => (
            <Link key={href} href={href}>
              <Button variant={"ghost"}>{label}</Button>
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Show when={"signed-out"}>
            <Link href={"/app/sign-in"}>
              <Button variant={"outline"} size={"lg"}>
                Đăng nhập
              </Button>
            </Link>
            <Link href={"/app/sign-up"}>
              <Button size={"lg"}>Thử LockIn miễn phí</Button>
            </Link>
          </Show>

          <Show when={"signed-in"}>
            <Link href={"/app"}>
              <Button size={"lg"}>Đi tới app</Button>
            </Link>
          </Show>
        </div>
      </div>
    </header>
  )
}

function HeroSection() {
  return (
    <section className="mx-auto max-w-360 px-27.5 py-2.5">
      <div className="flex flex-col items-center rounded-[20px] bg-[#fbf8ef] py-20">
        <div className="flex w-169.25 flex-col items-center gap-9.5">
          <div className="flex flex-col gap-3 text-center">
            <h1 className="font-sans-tight text-5xl leading-[1.2] font-medium">
              Biến những mục tiêu lớn
              <br />
              thành hành động nhỏ
            </h1>
            <p className="text-base leading-[1.4]">
              Chỉ cần bắt đầu bằng một mục tiêu nhỏ,
              <br />
              LockIn sẽ đồng hành cùng bạn đi đến đích.
            </p>
          </div>

          <div className="flex w-155 flex-col gap-3">
            <HeroInput />

            <div className="flex flex-wrap justify-center gap-2">
              {suggestionChips.map(({ icon: Icon, label }) => (
                <button
                  key={label}
                  type="button"
                  className="flex items-center gap-2 rounded-full border bg-white px-3 py-1.5 transition-colors hover:bg-gray-50"
                >
                  <Icon className="h-4 w-4 shrink-0 text-black" />
                  <span className="text-sm whitespace-nowrap text-black">
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function TimeSection() {
  return (
    <section id="gioi-thieu" className="mt-16">
      <div className="flex flex-col items-center gap-3 text-center text-[#281b01]">
        <h2 className="font-sans-tight text-4xl leading-[1.2] font-medium">
          Làm chủ thời gian,
          <br />
          làm chủ cuộc sống.
        </h2>
        <p className="text-base leading-[1.4]">
          Lock in từ những bước hành động nhỏ nhưng nhất quán.
          <br />
          Chúng tôi giúp bạn bắt đầu — và duy trì đến cùng.
        </p>
      </div>

      <div className="mx-auto mt-10 max-w-360 px-27.5">
        <div className="h-117.25 rounded-[20px] bg-[#fbf8ef]" />
      </div>
    </section>
  )
}

function FeaturesSection() {
  return (
    <section id="tinh-nang" className="mt-24">
      <div className="flex flex-col items-center gap-3 text-center text-[#281b01]">
        <h2 className="font-sans-tight text-3xl leading-[1.2] font-medium">
          Khám phá
          <br />
          các tính năng
        </h2>
        <p className="text-base leading-[1.4]">
          Mỗi tính năng được thiết kế để giúp bạn tập trung hơn
          <br />
          và hoàn thành nhanh hơn.
        </p>
      </div>

      <div className="mx-auto mt-16 flex max-w-360 items-center gap-20.5 px-27.5">
        <div className="flex w-104.25 shrink-0 flex-col gap-3 text-[#281b01]">
          <h3 className="font-sans-tight text-4xl leading-[1.2] font-medium">
            LockIn sắp xếp
            <br />
            cho bạn.
          </h3>
          <p className="text-base leading-[1.6]">
            Hỗ trợ sắp xếp nhiệm vụ hợp lý nhất. Không dồn việc, không quá tải.
            Và tất nhiên, bạn có thể chỉnh sửa mọi thứ theo ý mình.
          </p>
          <Link href="/app/sign-up">
            <Button size={"lg"}>Thử ngay</Button>
          </Link>
        </div>
        <div className="h-117.25 flex-1 rounded-[20px] bg-[#fbf8ef]" />
      </div>

      <div className="mx-auto mt-12 flex max-w-360 items-center gap-20.5 px-27.5">
        <div className="flex w-104.25 shrink-0 flex-col gap-3 text-[#281b01]">
          <h3 className="font-sans-tight text-4xl leading-[1.2] font-medium">
            Lock phân tâm.
            <br />
            Nâng cao hiệu suất.
          </h3>
          <p className="text-base leading-[1.6]">
            Chặn những website và ứng dụng khiến bạn mất tập trung. Khi vào
            LockIn Mode, bạn chỉ còn lại mục tiêu và công việc trước mắt. Không
            drama. Không FOMO. Chỉ có tiến độ.
          </p>
          <Link href="/app/sign-up">
            <Button size={"lg"}>Thử ngay</Button>
          </Link>
        </div>
        <div className="h-117.25 flex-1 rounded-[20px] bg-[#fbf8ef]" />
      </div>
    </section>
  )
}

function PricingSection() {
  return (
    <section id="bang-gia" className="mt-24">
      <div className="flex flex-col items-center gap-3 text-center text-[#281b01]">
        <h2 className="font-sans-tight text-3xl leading-[1.2] font-medium">
          Đầu tư cho
          <br />
          hiệu suất của bạn
        </h2>
        <p className="text-base leading-[1.4]">
          Luôn có một lựa chọn phù hợp với bạn.
        </p>
      </div>

      <div className="mx-auto mt-12 flex max-w-360 gap-6 px-27.5">
        <PricingCard
          plan="Free"
          price="Miễn phí"
          features={freePlanFeatures}
          ctaLabel="Thử ngay"
        />
        <PricingCard
          plan="Plus"
          price="50,000đ"
          addOn="Tất cả những tính năng của Free, cộng thêm:"
          features={paidPlanFeatures}
          ctaLabel="Thử miễn phí"
        />
        <PricingCard
          plan="Pro"
          price="50,000đ"
          addOn="Tất cả những tính năng của Plus, cộng thêm:"
          features={paidPlanFeatures}
          ctaLabel="Thử ngay"
        />
      </div>
    </section>
  )
}

function PricingCard({
  plan,
  price,
  addOn,
  features,
  ctaLabel,
}: {
  plan: string
  price: string
  addOn?: string
  features: string[]
  ctaLabel: string
}) {
  return (
    <div className="flex flex-1 flex-col justify-between gap-25 rounded-2xl border p-4">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-10 rounded-lg bg-muted p-4">
          <p className="font-sans-tight text-2xl font-medium">{plan}</p>
          <p className="text-xl text-muted-foreground">{price}</p>
        </div>
        <Link
          href="/app/sign-up"
          className="block rounded-full bg-[#f9b314] px-4 py-3 text-center text-base font-medium"
        >
          {ctaLabel}
        </Link>
        <div className="flex flex-col gap-3">
          {addOn && (
            <p className="text-base leading-[1.4] text-[#281b01]">{addOn}</p>
          )}
          {features.map((feature, i) => (
            <div key={i} className="flex items-center gap-2">
              <SquareCheckBig className="h-6 w-6 shrink-0 text-[#281b01]" />
              <p className="text-base leading-[1.4] whitespace-nowrap text-[#281b01]">
                {feature}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Footer() {
  return (
    <footer id="tai-xuong" className="mt-24 pb-16">
      <div className="mx-auto flex max-w-360 items-start justify-between px-27.5">
        <div className="flex flex-col gap-20">
          <div className="flex flex-col items-start gap-2">
            <LogoAccent className="h-10 w-fit" />
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<Button variant={"outline"} size={"lg"} />}
              >
                <LanguagesIcon data-icon="inline-start" />
                Tiếng Việt
                <ChevronDown
                  data-icon="inline-end"
                  className="text-muted-foreground"
                />
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuGroup>
                  <DropdownMenuItem>Tiếng Việt</DropdownMenuItem>
                  <DropdownMenuItem>English</DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <p className="text-xs text-muted-foreground">
            ©2026 LockIn Labs, Inc.
          </p>
        </div>

        <div className="flex w-132 items-start justify-between">
          {Object.entries(footerLinks).map(([heading, links]) => (
            <div key={heading} className="flex flex-col gap-3">
              <p className="text-sm font-medium whitespace-nowrap text-black">
                {heading}
              </p>
              <div className="flex flex-col gap-2">
                {links.map((link) => (
                  <a
                    key={link}
                    href="#"
                    className="text-sm whitespace-nowrap text-[#646464] transition-colors hover:text-[#281b01]"
                  >
                    {link}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </footer>
  )
}