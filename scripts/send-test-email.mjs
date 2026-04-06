import { Resend } from "resend";
import "dotenv/config";

const resend = new Resend(process.env.RESEND_API_KEY);

const { data, error } = await resend.emails.send({
  from: "Apollo Home Builders <hello@apollohomebuilders.com>",
  to: "kyle@apollohomebuilders.com",
  subject: "Test Email — Homes by Apollo CRM",
  html: `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#ffffff;">
      <img src="https://d2xsxph8kpxj0f.cloudfront.net/310419663032182609/mwVy9Am3ywXkRkqF68TJjK/apollo-logo-horizontal_578ef147.png"
        alt="Homes by Apollo" style="height:48px;margin-bottom:28px;" />
      <h2 style="color:#0f2044;margin:0 0 12px;font-size:22px;">Email Delivery Test</h2>
      <p style="color:#374151;margin:0 0 20px;line-height:1.7;font-size:15px;">
        Hi Kyle,<br/><br/>
        This is a test email from the Homes by Apollo CRM system to confirm that transactional email delivery
        via Resend is working correctly from the <strong>hello@apollohomebuilders.com</strong> sender address.
      </p>
      <div style="background:#f0f4ff;border-left:4px solid #0f2044;padding:16px 20px;border-radius:4px;margin-bottom:24px;">
        <p style="margin:0;color:#0f2044;font-size:14px;font-weight:600;">✅ Email infrastructure is operational</p>
        <p style="margin:4px 0 0;color:#374151;font-size:13px;">Sent from: hello@apollohomebuilders.com via Resend</p>
      </div>
      <p style="color:#9ca3af;font-size:13px;margin-top:24px;">
        You can safely ignore this email — it was sent as part of a system configuration check.
      </p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
      <p style="color:#9ca3af;font-size:12px;margin:0;">Apollo Home Builders &mdash; Pahrump, NV &mdash; (775) 363-1616</p>
    </div>
  `,
});

if (error) {
  console.error("❌ Email failed:", error);
  process.exit(1);
} else {
  console.log("✅ Test email sent successfully!");
  console.log("   ID:", data.id);
  console.log("   To: kyle@apollohomebuilders.com");
  console.log("   From: hello@apollohomebuilders.com");
}
