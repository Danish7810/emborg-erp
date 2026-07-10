const fs = require('fs');
const path = require('path');

const debugRoute = `import { NextResponse } from "next/server";

function decodeJwtPayload(token: string) {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const payload = Buffer.from(parts[1], "base64").toString("utf8");
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

export async function GET() {
  const key = process.env.SUPABASE_SERVICE_KEY || "";
  const cronSecret = process.env.CRON_SECRET || "";
  const decoded = decodeJwtPayload(key);

  return NextResponse.json({
    service_key_present: key.length > 0,
    service_key_length: key.length,
    service_key_role: decoded?.role || "could not decode",
    service_key_ref: decoded?.ref || "n/a",
    cron_secret_present: cronSecret.length > 0,
  });
}
`;

const debugPath = path.join('C:\\Users\\Danish\\emborg', 'app', 'api', 'debug-env', 'route.ts');
fs.writeFileSync(debugPath, debugRoute, { encoding: 'utf8' });
console.log('✅ Updated: app/api/debug-env/route.ts — now decodes the JWT role claim');
console.log('   Expecting: service_key_role should say "service_role"');
console.log('   If it says "anon" — that confirms the wrong key was copied');
console.log('');
console.log('Run: npm run build, git add/commit/push, then revisit the URL');
