const fs = require('fs');
const path = require('path');

const debugRoute = `import { NextResponse } from "next/server";

export async function GET() {
  const key = process.env.SUPABASE_SERVICE_KEY || "";
  const cronSecret = process.env.CRON_SECRET || "";

  return NextResponse.json({
    service_key_present: key.length > 0,
    service_key_length: key.length,
    service_key_prefix: key.substring(0, 12),
    service_key_type: key.startsWith("eyJ") ? "legacy_jwt" : key.startsWith("sb_secret_") ? "new_secret_key" : key.length === 0 ? "MISSING" : "unknown",
    cron_secret_present: cronSecret.length > 0,
    cron_secret_length: cronSecret.length,
  });
}
`;

const debugPath = path.join('C:\\Users\\Danish\\emborg', 'app', 'api', 'debug-env', 'route.ts');
fs.mkdirSync(path.dirname(debugPath), { recursive: true });
fs.writeFileSync(debugPath, debugRoute, { encoding: 'utf8' });
console.log('✅ Written: app/api/debug-env/route.ts');
console.log('');
console.log('This is a TEMPORARY diagnostic route — delete it after we fix this.');
console.log('It does NOT expose your actual keys, only their length/type/prefix.');
console.log('');
console.log('Run: npm run build, then git add/commit/push, then visit:');
console.log('https://www.emborgerp.com/api/debug-env');
