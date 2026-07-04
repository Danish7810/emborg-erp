type EmailBlock = {
  badgeText: string;
  badgeColor: string;
  badgeBg: string;
  heading: string;
  bodyHtml: string;   // inner paragraphs, already formatted
  ctaText?: string;
  ctaUrl?: string;
};

export function renderEmborgEmail(block: EmailBlock): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#f8f8ff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#2563EB,#4F46E5);padding:32px 40px;">
      <h1 style="margin:0;font-size:28px;font-weight:800;color:white;letter-spacing:-1px;">EMBORG</h1>
      <p style="margin:4px 0 0;font-size:13px;color:rgba(255,255,255,0.8);">Cloud ERP for SMEs</p>
    </div>
    <div style="padding:40px;">
      <div style="display:inline-block;padding:6px 14px;background:${block.badgeBg};border-radius:20px;margin-bottom:24px;">
        <span style="font-size:12px;font-weight:700;color:${block.badgeColor};">${block.badgeText}</span>
      </div>
      <h2 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#1a1a2e;">${block.heading}</h2>
      ${block.bodyHtml}
      ${block.ctaUrl ? `<a href="${block.ctaUrl}" style="display:inline-block;margin-top:20px;padding:14px 32px;background:#2563EB;color:white;text-decoration:none;border-radius:10px;font-weight:700;font-size:15px;">${block.ctaText}</a>` : ""}
      <div style="margin-top:32px;padding-top:24px;border-top:1px solid #eee;text-align:center;">
        <p style="margin:0;font-size:12px;color:#aaa;">Sent via <strong style="color:#2563EB;">EMBORG</strong> — emborgerp.com</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}
