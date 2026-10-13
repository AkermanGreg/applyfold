import { ClerkProvider } from "@clerk/nextjs";
import { shadcn } from "@clerk/ui/themes";
import type { Metadata } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";

import { Toaster } from "@/components/ui/sonner";
import { isAuthConfigured } from "@/lib/auth-config";
import { brand } from "@/lib/brand";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/** Display face for marketing headlines and onboarding titles; the product UI stays in Geist. */
const instrumentSerif = Instrument_Serif({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: {
    default: `${brand.name}: AI job applications that sound like you`,
    template: `%s · ${brand.name}`,
  },
  description: brand.description,
  applicationName: brand.name,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {isAuthConfigured ? (
          <ClerkProvider
            appearance={{ theme: shadcn }}
            signInUrl="/sign-in"
            signUpUrl="/sign-up"
            // Returning users land in the app; new accounts go straight into guided onboarding.
            signInFallbackRedirectUrl="/app"
            signUpFallbackRedirectUrl="/app/onboarding"
            afterSignOutUrl="/"
          >
            {children}
          </ClerkProvider>
        ) : (
          children
        )}
        <Toaster theme="light" position="top-center" />
      </body>
    </html>
  );
}
