import type { Metadata } from "next"
import { Suspense } from "react"

import { IconBook } from "@/components/icons"
import { LoginForm } from "./login-form"

export const metadata: Metadata = { title: "Sign in" }

export default function LoginPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <span className="flex size-10 items-center justify-center bg-primary text-primary-foreground">
          <IconBook size={20} />
        </span>
        <span className="font-mono text-base font-medium">GitBasedDocs</span>
        <span className="font-mono text-xs text-muted-foreground">Private docs from your GitHub repo</span>
      </div>
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  )
}
