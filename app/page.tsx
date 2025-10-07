import { Suspense } from "react"
import { EmailTemplateApp } from "@/components/email-template-app"

export default function Page() {
  return (
    <main className="min-h-dvh">
      <div className="mx-auto max-w-7xl p-6 md:p-10">
        <h1 className="text-pretty text-2xl font-semibold tracking-tight md:text-3xl">Email Templates</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Create, upload, edit content via placeholders, preview, and export HTML.
        </p>
        <Suspense fallback={<div className="mt-6 text-sm text-muted-foreground">Loading…</div>}>
          <EmailTemplateApp />
        </Suspense>
      </div>
    </main>
  )
}
