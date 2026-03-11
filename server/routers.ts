import { COOKIE_NAME } from "@shared/const";
import { Resend } from "resend";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { notifyOwner } from "./_core/notification";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";

const resend = new Resend(process.env.RESEND_API_KEY);

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  contact: router({
    submit: publicProcedure
      .input(
        z.object({
          name: z.string().min(1),
          email: z.string().email(),
          phone: z.string().optional(),
          message: z.string().min(1),
        })
      )
      .mutation(async ({ input }) => {
        const { name, email, phone, message } = input;

        const htmlBody = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #0f2044;">New Lead from Apollo Home Builders Website</h2>
            <table style="width:100%; border-collapse: collapse;">
              <tr><td style="padding:8px; font-weight:bold; color:#555;">Name</td><td style="padding:8px;">${name}</td></tr>
              <tr><td style="padding:8px; font-weight:bold; color:#555;">Email</td><td style="padding:8px;"><a href="mailto:${email}">${email}</a></td></tr>
              ${phone ? `<tr><td style="padding:8px; font-weight:bold; color:#555;">Phone</td><td style="padding:8px;">${phone}</td></tr>` : ""}
              <tr><td style="padding:8px; font-weight:bold; color:#555; vertical-align:top;">Message</td><td style="padding:8px;">${message.replace(/\n/g, "<br>")}</td></tr>
            </table>
            <hr style="margin-top:24px; border:none; border-top:1px solid #eee;">
            <p style="color:#999; font-size:12px;">Sent from apollohomebuilders.com contact form</p>
          </div>
        `;

        // Send email via Resend
        const { error } = await resend.emails.send({
          from: "Apollo Home Builders <onboarding@resend.dev>",
          to: ["app@apollohomebuilders.com"],
          replyTo: email,
          subject: `New Lead: ${name}`,
          html: htmlBody,
        });

        if (error) {
          console.error("[Resend] Failed to send email:", error);
          throw new Error("Failed to send message. Please try again.");
        }

        // Also notify the Manus project owner
        await notifyOwner({
          title: `New Lead: ${name}`,
          content: `Email: ${email}${phone ? ` | Phone: ${phone}` : ""}\n\n${message}`,
        }).catch(() => {}); // non-blocking

        return { success: true };
      }),

    // Lightweight test endpoint to validate Resend key
    testKey: publicProcedure.query(async () => {
      const domains = await resend.domains.list();
      return { ok: !domains.error };
    }),
  }),
});

export type AppRouter = typeof appRouter;
