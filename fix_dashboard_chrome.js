const fs = require('fs');
const path = require('path');
const ROOT = 'C:\\Users\\Danish\\emborg';

const headerPath = path.join(ROOT, 'app', 'components', 'SiteHeader.tsx');
let src = fs.readFileSync(headerPath, 'utf8');

// 1. Add usePathname import
if (!src.includes('usePathname')) {
  src = src.replace(
    `import { useState, useEffect } from "react";`,
    `import { useState, useEffect } from "react";\nimport { usePathname } from "next/navigation";`
  );
}

// 2. Compute pathname + hideChrome flag right after existing state declarations
src = src.replace(
  `export default function SiteHeader({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);`,
  `export default function SiteHeader({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const pathname = usePathname();
  // Dashboard and auth pages have their own complete layout/chrome —
  // don't wrap them in the marketing header/footer/chat widget.
  const hideMarketingChrome = pathname?.startsWith("/dashboard") || pathname?.startsWith("/auth");`
);

// 3. Branch the return: if hideMarketingChrome, render children only (theme effect above still runs normally)
src = src.replace(
  `  return (
    <>
      <header style={{ borderBottom: "1px solid var(--line)", backgroundColor: "var(--bg)", position: "sticky", top: 0, zIndex: 1000 }}>`,
  `  if (hideMarketingChrome) {
    return <>{children}</>;
  }

  return (
    <>
      <header style={{ borderBottom: "1px solid var(--line)", backgroundColor: "var(--bg)", position: "sticky", top: 0, zIndex: 1000 }}>`
);

fs.writeFileSync(headerPath, src, { encoding: 'utf8' });
console.log('✅ SiteHeader.tsx: dashboard/auth routes now skip marketing header, footer, and Tawk chat');
console.log('   This removes the duplicate nav bars, duplicate chat bubbles, and the');
console.log('   marketing footer that were all stacking on top of the dashboard layout.');
console.log('');
console.log('Run: npm run build');
