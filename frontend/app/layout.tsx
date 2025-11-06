import { ThemeProvider } from "next-themes";
import Script from "next/script"; // Import the Next.js Script component
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider attribute="class" defaultTheme="dark">
          {children}
        </ThemeProvider>

        {/* --- Eruda.js Scripts for Mobile Console --- */}
        <Script src="//cdn.jsdelivr.net/npm/eruda" />
        <Script id="eruda-init">
          {`eruda.init();`}
        </Script>
        {/* --- End Eruda.js Scripts --- */}
        
      </body>
    </html>
  );
}