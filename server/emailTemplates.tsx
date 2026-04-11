/**
 * React Email Templates for Apollo Home Builders
 * Render to HTML using @react-email/render before sending via Resend.
 *
 * Usage:
 *   import { renderCampaignBlast } from "./emailTemplates";
 *   const html = await renderCampaignBlast({ subject, body, recipientName, unsubscribeUrl });
 */

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { render } from "@react-email/render";
import * as React from "react";

// ─── Shared brand constants ───────────────────────────────────────────────────

const BRAND_COLOR = "#1a3a5c";
const ACCENT_COLOR = "#c8a96e";
const BG_COLOR = "#f8f6f2";
const TEXT_COLOR = "#2d2d2d";
const MUTED_COLOR = "#6b7280";
const LOGO_URL =
  "https://cdn.manus.im/webdev/apollo-dashboard/apollo-logo-email.png";

// ─── Base Layout ─────────────────────────────────────────────────────────────

function EmailBase({
  previewText,
  children,
  unsubscribeUrl,
}: {
  previewText?: string;
  children: React.ReactNode;
  unsubscribeUrl?: string;
}) {
  return (
    <Html lang="en">
      <Head />
      {previewText && <Preview>{previewText}</Preview>}
      <Body
        style={{
          backgroundColor: BG_COLOR,
          fontFamily:
            "'Georgia', 'Times New Roman', serif",
          margin: 0,
          padding: 0,
        }}
      >
        {/* Header */}
        <Section style={{ backgroundColor: BRAND_COLOR, padding: "24px 0" }}>
          <Container style={{ maxWidth: "600px", margin: "0 auto", textAlign: "center" }}>
            <Text
              style={{
                color: ACCENT_COLOR,
                fontSize: "22px",
                fontWeight: "bold",
                letterSpacing: "2px",
                textTransform: "uppercase",
                margin: 0,
              }}
            >
              APOLLO HOME BUILDERS
            </Text>
            <Text
              style={{
                color: "#a0aec0",
                fontSize: "12px",
                letterSpacing: "1px",
                margin: "4px 0 0",
              }}
            >
              Pahrump, Nevada
            </Text>
          </Container>
        </Section>

        {/* Content */}
        <Container
          style={{
            maxWidth: "600px",
            margin: "0 auto",
            backgroundColor: "#ffffff",
            borderRadius: "0 0 8px 8px",
            overflow: "hidden",
          }}
        >
          {children}
        </Container>

        {/* Footer */}
        <Container style={{ maxWidth: "600px", margin: "24px auto 0", textAlign: "center" }}>
          <Text style={{ color: MUTED_COLOR, fontSize: "12px", lineHeight: "1.6" }}>
            Apollo Home Builders · 420 Belville Rd, Pahrump, NV 89048
            <br />
            <Link
              href="https://apollohomebuilders.com"
              style={{ color: MUTED_COLOR }}
            >
              apollohomebuilders.com
            </Link>
          </Text>
          {unsubscribeUrl && (
            <Text style={{ color: MUTED_COLOR, fontSize: "11px", marginTop: "8px" }}>
              You received this email because you inquired about a home with Apollo Home Builders.
              <br />
              <Link
                href={unsubscribeUrl}
                style={{ color: MUTED_COLOR, textDecoration: "underline" }}
              >
                Unsubscribe from future emails
              </Link>
            </Text>
          )}
        </Container>
      </Body>
    </Html>
  );
}

// ─── Template 1: Campaign Blast ───────────────────────────────────────────────

interface CampaignBlastProps {
  subject: string;
  previewText?: string;
  recipientName?: string;
  bodyHtml: string;
  ctaText?: string;
  ctaUrl?: string;
  unsubscribeUrl: string;
}

function CampaignBlastEmail({
  previewText,
  recipientName,
  bodyHtml,
  ctaText,
  ctaUrl,
  unsubscribeUrl,
}: CampaignBlastProps) {
  return (
    <EmailBase previewText={previewText} unsubscribeUrl={unsubscribeUrl}>
      <Section style={{ padding: "40px 48px 24px" }}>
        {recipientName && (
          <Text style={{ color: MUTED_COLOR, fontSize: "14px", margin: "0 0 16px" }}>
            Hi {recipientName},
          </Text>
        )}
        <div
          dangerouslySetInnerHTML={{ __html: bodyHtml }}
          style={{ color: TEXT_COLOR, fontSize: "16px", lineHeight: "1.7" }}
        />
        {ctaText && ctaUrl && (
          <Section style={{ textAlign: "center", margin: "32px 0" }}>
            <Button
              href={ctaUrl}
              style={{
                backgroundColor: BRAND_COLOR,
                color: "#ffffff",
                padding: "14px 32px",
                borderRadius: "4px",
                fontSize: "14px",
                fontWeight: "bold",
                letterSpacing: "1px",
                textTransform: "uppercase",
                textDecoration: "none",
              }}
            >
              {ctaText}
            </Button>
          </Section>
        )}
      </Section>
      <Hr style={{ borderColor: "#e5e7eb", margin: "0 48px" }} />
      <Section style={{ padding: "24px 48px" }}>
        <Text style={{ color: MUTED_COLOR, fontSize: "13px", lineHeight: "1.6" }}>
          Questions? Reply to this email or call us at{" "}
          <Link href="tel:+17025551234" style={{ color: BRAND_COLOR }}>
            (702) 555-1234
          </Link>
        </Text>
      </Section>
    </EmailBase>
  );
}

// ─── Template 2: New Lead Welcome ─────────────────────────────────────────────

interface NewLeadWelcomeProps {
  firstName: string;
  unsubscribeUrl: string;
}

function NewLeadWelcomeEmail({ firstName, unsubscribeUrl }: NewLeadWelcomeProps) {
  return (
    <EmailBase
      previewText={`Welcome, ${firstName}! We're excited to help you find your new home in Pahrump.`}
      unsubscribeUrl={unsubscribeUrl}
    >
      <Section style={{ padding: "40px 48px 24px" }}>
        <Heading
          style={{
            color: BRAND_COLOR,
            fontSize: "28px",
            fontWeight: "bold",
            margin: "0 0 16px",
            lineHeight: "1.3",
          }}
        >
          Welcome to Apollo Home Builders, {firstName}!
        </Heading>
        <Text style={{ color: TEXT_COLOR, fontSize: "16px", lineHeight: "1.7", margin: "0 0 16px" }}>
          Thank you for reaching out. We're thrilled to have the opportunity to help you find your
          perfect home in Pahrump, Nevada — one of the fastest-growing communities in the Silver State.
        </Text>
        <Text style={{ color: TEXT_COLOR, fontSize: "16px", lineHeight: "1.7", margin: "0 0 24px" }}>
          A member of our team will be in touch within 24 hours to learn more about what you're
          looking for. In the meantime, feel free to browse our available homes and lots.
        </Text>
        <Section style={{ textAlign: "center", margin: "32px 0" }}>
          <Button
            href="https://apollohomebuilders.com/find-your-home"
            style={{
              backgroundColor: BRAND_COLOR,
              color: "#ffffff",
              padding: "14px 32px",
              borderRadius: "4px",
              fontSize: "14px",
              fontWeight: "bold",
              letterSpacing: "1px",
              textTransform: "uppercase",
              textDecoration: "none",
            }}
          >
            View Available Homes
          </Button>
        </Section>
      </Section>
      <Section
        style={{
          backgroundColor: "#f0ece4",
          padding: "24px 48px",
          margin: "0",
        }}
      >
        <Text
          style={{
            color: BRAND_COLOR,
            fontSize: "14px",
            fontWeight: "bold",
            margin: "0 0 8px",
            textTransform: "uppercase",
            letterSpacing: "1px",
          }}
        >
          Why Apollo?
        </Text>
        <Text style={{ color: TEXT_COLOR, fontSize: "14px", lineHeight: "1.7", margin: "0" }}>
          ✓ New construction homes from the $300s
          <br />
          ✓ Custom lot selection available
          <br />
          ✓ Preferred lender network for fast approvals
          <br />
          ✓ Local team with deep Pahrump market knowledge
        </Text>
      </Section>
      <Hr style={{ borderColor: "#e5e7eb", margin: "0 48px" }} />
      <Section style={{ padding: "24px 48px" }}>
        <Text style={{ color: MUTED_COLOR, fontSize: "13px", lineHeight: "1.6" }}>
          Questions? Reply to this email or call us at{" "}
          <Link href="tel:+17025551234" style={{ color: BRAND_COLOR }}>
            (702) 555-1234
          </Link>
        </Text>
      </Section>
    </EmailBase>
  );
}

// ─── Template 3: Tour Reminder ────────────────────────────────────────────────

interface TourReminderProps {
  firstName: string;
  tourDate: string;   // e.g. "Saturday, April 12th at 2:00 PM"
  location?: string;
  agentName?: string;
  unsubscribeUrl: string;
}

function TourReminderEmail({
  firstName,
  tourDate,
  location,
  agentName,
  unsubscribeUrl,
}: TourReminderProps) {
  return (
    <EmailBase
      previewText={`Reminder: Your Apollo Home Builders tour is scheduled for ${tourDate}`}
      unsubscribeUrl={unsubscribeUrl}
    >
      <Section style={{ padding: "40px 48px 24px" }}>
        <Heading
          style={{
            color: BRAND_COLOR,
            fontSize: "26px",
            fontWeight: "bold",
            margin: "0 0 16px",
            lineHeight: "1.3",
          }}
        >
          Your Tour is Coming Up, {firstName}!
        </Heading>
        <Text style={{ color: TEXT_COLOR, fontSize: "16px", lineHeight: "1.7", margin: "0 0 16px" }}>
          Just a friendly reminder that your home tour with Apollo Home Builders is scheduled for:
        </Text>
        <Section
          style={{
            backgroundColor: "#f0ece4",
            borderLeft: `4px solid ${ACCENT_COLOR}`,
            padding: "16px 24px",
            margin: "0 0 24px",
            borderRadius: "0 4px 4px 0",
          }}
        >
          <Text
            style={{
              color: BRAND_COLOR,
              fontSize: "18px",
              fontWeight: "bold",
              margin: "0 0 4px",
            }}
          >
            {tourDate}
          </Text>
          {location && (
            <Text style={{ color: TEXT_COLOR, fontSize: "14px", margin: "0" }}>
              {location}
            </Text>
          )}
          {agentName && (
            <Text style={{ color: MUTED_COLOR, fontSize: "13px", margin: "8px 0 0" }}>
              Your agent: {agentName}
            </Text>
          )}
        </Section>
        <Text style={{ color: TEXT_COLOR, fontSize: "16px", lineHeight: "1.7", margin: "0 0 24px" }}>
          If you need to reschedule, please reply to this email or call us and we'll find a time
          that works for you.
        </Text>
        <Section style={{ textAlign: "center", margin: "24px 0" }}>
          <Button
            href="https://apollohomebuilders.com/schedule-a-tour"
            style={{
              backgroundColor: BRAND_COLOR,
              color: "#ffffff",
              padding: "14px 32px",
              borderRadius: "4px",
              fontSize: "14px",
              fontWeight: "bold",
              letterSpacing: "1px",
              textTransform: "uppercase",
              textDecoration: "none",
            }}
          >
            Reschedule Tour
          </Button>
        </Section>
      </Section>
      <Hr style={{ borderColor: "#e5e7eb", margin: "0 48px" }} />
      <Section style={{ padding: "24px 48px" }}>
        <Text style={{ color: MUTED_COLOR, fontSize: "13px", lineHeight: "1.6" }}>
          Questions? Reply to this email or call us at{" "}
          <Link href="tel:+17025551234" style={{ color: BRAND_COLOR }}>
            (702) 555-1234
          </Link>
        </Text>
      </Section>
    </EmailBase>
  );
}

// ─── Template 4: Unsubscribe Confirmation ─────────────────────────────────────

interface UnsubscribeConfirmationProps {
  email: string;
}

function UnsubscribeConfirmationEmail({ email }: UnsubscribeConfirmationProps) {
  return (
    <EmailBase previewText="You've been unsubscribed from Apollo Home Builders emails">
      <Section style={{ padding: "40px 48px" }}>
        <Heading
          style={{
            color: BRAND_COLOR,
            fontSize: "24px",
            fontWeight: "bold",
            margin: "0 0 16px",
          }}
        >
          You've been unsubscribed
        </Heading>
        <Text style={{ color: TEXT_COLOR, fontSize: "16px", lineHeight: "1.7", margin: "0 0 16px" }}>
          We've removed <strong>{email}</strong> from our mailing list. You won't receive any
          further marketing emails from Apollo Home Builders.
        </Text>
        <Text style={{ color: TEXT_COLOR, fontSize: "16px", lineHeight: "1.7", margin: "0 0 24px" }}>
          If you unsubscribed by mistake, you can re-subscribe by visiting our website or
          contacting us directly.
        </Text>
        <Section style={{ textAlign: "center", margin: "24px 0" }}>
          <Button
            href="https://apollohomebuilders.com"
            style={{
              backgroundColor: BRAND_COLOR,
              color: "#ffffff",
              padding: "14px 32px",
              borderRadius: "4px",
              fontSize: "14px",
              fontWeight: "bold",
              letterSpacing: "1px",
              textTransform: "uppercase",
              textDecoration: "none",
            }}
          >
            Visit Our Website
          </Button>
        </Section>
      </Section>
    </EmailBase>
  );
}

// ─── Render helpers ───────────────────────────────────────────────────────────

export async function renderCampaignBlast(props: CampaignBlastProps): Promise<string> {
  return render(<CampaignBlastEmail {...props} />);
}

export async function renderNewLeadWelcome(props: NewLeadWelcomeProps): Promise<string> {
  return render(<NewLeadWelcomeEmail {...props} />);
}

export async function renderTourReminder(props: TourReminderProps): Promise<string> {
  return render(<TourReminderEmail {...props} />);
}

export async function renderUnsubscribeConfirmation(
  props: UnsubscribeConfirmationProps,
): Promise<string> {
  return render(<UnsubscribeConfirmationEmail {...props} />);
}

/** Build a plain-text campaign body from HTML (strip tags) */
export function htmlToPlainText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
