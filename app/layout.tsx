import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/shared/theme-provider";
import { CommandSearchDialog } from "@/components/navigation/command-search-dialog";
import { GlobalModals } from "@/components/shared/modals";
import { Toaster } from "@/components/ui/toast";

export const metadata: Metadata = {
  title: {
    default: "CODEFLOW AI — Understand Every Line. Visualize Every Step.",
    template: "%s · CODEFLOW AI",
  },
  description:
    "Interactive programming learning and visualization platform. Understand code through step-by-step execution, real-time memory visualizations, and AI-powered explanations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <ThemeProvider>
          {children}
          <CommandSearchDialog />
          <GlobalModals />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}

