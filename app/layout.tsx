import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { PageHeader } from "@/components/page-header"
import { PageContainer } from "@/components/page-container"
import { Toaster } from "@/components/ui/toaster"
import { ClientLayout } from "@/components/client-layout"
import { RealTimeNotifications } from "@/components/real-time-notifications"
import { UserProvider } from "@/contexts/UserContext"
import { EngagementProvider } from "@/contexts/engagement-context"
import { ApiCallMonitor } from "@/components/debug/ApiCallMonitor"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Author's Info",
  description: "A social platform for book lovers",
  generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning className={`${inter.className} root-layout__body min-h-screen flex flex-col items-center`} style={{ backgroundColor: '#F2F4F7' }}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <UserProvider>
            <EngagementProvider>
              <div className="root-layout__content-wrapper w-full">
                <ClientLayout>
                  {children}
                </ClientLayout>
                <RealTimeNotifications />
              </div>
              <Toaster />
              {process.env.NODE_ENV === 'development' && <ApiCallMonitor />}
            </EngagementProvider>
          </UserProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
