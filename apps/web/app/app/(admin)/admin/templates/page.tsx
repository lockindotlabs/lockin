import { TemplateReviewClient } from "@/components/admin/templates/TemplateReviewClient"

export default function AdminTemplatesPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-medium">Template review</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Duyet hoac tu choi template truoc khi no xuat hien cong khai trong marketplace.
        </p>
      </div>

      <TemplateReviewClient />
    </main>
  )
}
