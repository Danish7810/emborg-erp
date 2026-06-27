import "./globals.css";
import SiteHeader from "./components/SiteHeader";
import PageWrapper from "./components/PageWrapper";

export const metadata = {
  title: "EMBORG ERP - Simplifying Business Operations",
  description: "EMBORG is a modern cloud ERP platform for SMEs, unifying inventory, finance, CRM, HR, sales, and project management in one system.",
  keywords: "ERP software, SME ERP, cloud ERP, inventory management, CRM, HR payroll, business management platform",
  verification: { google: "6tVIHU-kIRIyYyZsMRd4FMq63YyYu-KT7iiwqcM3LP4" }, openGraph: {
    title: "EMBORG ERP - Simplifying Business Operations",
    description: "Run your entire business in one system. EMBORG unifies finance, inventory, CRM, HR, sales, and projects for growing SMEs.",
    url: "https://emborgerp.com",
    siteName: "EMBORG",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SiteHeader><PageWrapper>{children}</PageWrapper></SiteHeader>
      </body>
    </html>
  );
}





