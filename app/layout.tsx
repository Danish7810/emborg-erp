import "./globals.css";
import SiteHeader from "./components/SiteHeader";

export const metadata = {
  title: "EMBORG ERP - Simplifying Business Operations",
  description: "EMBORG is a modern cloud ERP platform for SMEs, unifying inventory, finance, CRM, HR, sales, and project management in one system.",
  keywords: "ERP software, SME ERP, cloud ERP, inventory management, CRM, HR payroll, business management platform",
  openGraph: {
    title: "EMBORG ERP - Simplifying Business Operations",
    description: "Run your entire business in one system. EMBORG unifies finance, inventory, CRM, HR, sales, and projects for growing SMEs.",
    url: "https://emborg-erp-b7vr.vercel.app",
    siteName: "EMBORG",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SiteHeader>{children}</SiteHeader>
      </body>
    </html>
  );
}
