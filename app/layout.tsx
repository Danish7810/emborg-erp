import "./globals.css";
import PwaInit from "./components/PwaInit";
import SiteHeader from "./components/SiteHeader";
import PageWrapper from "./components/PageWrapper";

export const metadata = {
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "EMBORG ERP",
    startupImage: "/icons/apple-touch-icon.png",
  },
  icons: {
    apple: "/icons/apple-touch-icon.png",
    icon: [
      { url: "/icons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192x192.png",  sizes: "192x192", type: "image/png" },
    ],
  },
  formatDetection: { telephone: false },
  title: "EMBORG ERP - Simplifying Business Operations",
  description: "EMBORG is a modern cloud ERP platform for SMEs, unifying inventory, finance, CRM, HR, sales, and project management in one system.",
  keywords: "ERP software, SME ERP, cloud ERP, inventory management, CRM, HR payroll, business management platform",
  verification: { google: "6tVIHU-kIRIyYyZsMRd4FMq63YyYu-KT7iiwqcM3LP4" }, openGraph: {
    title: "EMBORG ERP - Simplifying Business Operations",
    description: "Run your entire business in one system. EMBORG unifies finance, inventory, CRM, HR, sales, and projects for growing SMEs.",
    url: "https://www.emborgerp.com",
    siteName: "EMBORG",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body><PwaInit />
        <SiteHeader><PageWrapper>{children}</PageWrapper></SiteHeader>
      </body>
    </html>
  );
}





