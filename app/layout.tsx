import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import GoogleAnalytics from "@/components/google-analytics"
// import { GTM_ID } from "@/lib/gtm"

const inter = Inter({ subsets: ["latin"] })

// Your Google Analytics Measurement ID
const GA_MEASUREMENT_ID = "G-HFTV8CW3HR"
const GTM_ID = "GTM-MBLZJ6T2"

export const metadata: Metadata = {
  title: "QBCC Home Warranty Insurance Calculator | Premium Estimator",
  description:
    "Calculate QBCC home warranty insurance premiums for new construction and renovations based on the July 2020 premium table. Free online calculator for Queensland builders and homeowners.",
  keywords: [
    "QBCC Home Warranty Insurance Calculator",
    "Queensland Building and Construction Commission",
    "QBCC premium calculator",
    "home warranty insurance fees",
    "QBCC insurance premium rates",
    "calculate QBCC insurance",
    "Queensland home warranty scheme",
    "QBCC insurance estimator",
    "building insurance calculator Queensland",
  ],
  authors: [{ name: "QBCC Calculator" }],
  creator: "QBCC Calculator",
  publisher: "QBCC Calculator",
  openGraph: {
    type: "website",
    locale: "en_AU",
    url: "https://qbcc-calculator.vercel.app/",
    title: "QBCC Home Warranty Insurance Calculator | Premium Estimator",
    description:
      "Calculate QBCC home warranty insurance premiums for new construction and renovations based on the July 2020 premium table.",
    siteName: "QBCC Home Warranty Insurance Calculator",
  },
  twitter: {
    card: "summary_large_image",
    title: "QBCC Home Warranty Insurance Calculator | Premium Estimator",
    description:
      "Calculate QBCC home warranty insurance premiums for new construction and renovations based on the July 2020 premium table.",
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://qbcc-calculator.vercel.app/",
  },
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en-AU" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes" />
        <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#1e1e2e" media="(prefers-color-scheme: dark)" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="format-detection" content="telephone=no" />
        {/* Google Tag Manager */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');
    `,
          }}
        />
      </head>
      <body className={inter.className}>
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
        <GoogleAnalytics GA_MEASUREMENT_ID={GA_MEASUREMENT_ID} />
      </body>
    </html>
  )
}
