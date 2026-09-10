import type { Metadata } from "next"
import { Geist, JetBrains_Mono, Merriweather } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils";
import { PREFS_SCRIPT } from "@/lib/viewer/prefs"

const merriweatherHeading = Merriweather({subsets:['latin'],variable:'--font-heading'});

const fontSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
})

const jetbrainsMono = JetBrains_Mono({subsets:['latin'],variable:'--font-mono'})

// Every tab says which page it is, then the product: "Users · Admin · GitBasedDocs".
export const metadata: Metadata = {
  title: { default: "GitBasedDocs", template: "%s · GitBasedDocs" },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      // Smooth scrolling for #links; Next turns it off during route changes.
      data-scroll-behavior="smooth"
      className={cn("antialiased", fontSans.variable, "font-mono", jetbrainsMono.variable, merriweatherHeading.variable)}
    >
      <head>
        {/* Reader width and outline choice, applied before first paint. */}
        <script dangerouslySetInnerHTML={{ __html: PREFS_SCRIPT }} />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
