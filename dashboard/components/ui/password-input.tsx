"use client"

import { useState } from "react"
import { cn } from "cn"

import { Input } from "@/components/ui/input"
import { IconEye, IconEyeOff } from "@/components/icons"

// Password field with an eye toggle, so people can check what they typed.
export function PasswordInput({ className, ...props }: Omit<React.ComponentProps<"input">, "type">) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <Input {...props} type={show ? "text" : "password"} className={cn("pe-10", className)} />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Hide password" : "Show password"}
        aria-pressed={show}
        className="absolute inset-y-0 end-0 flex w-10 cursor-pointer items-center justify-center text-muted-foreground hover:text-foreground"
      >
        {show ? <IconEyeOff size={15} /> : <IconEye size={15} />}
      </button>
    </div>
  )
}
