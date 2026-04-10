# Weekly Update — Homes by Apollo Digital Build
**To:** Brandon, Jonathan
**From:** Kyle
**Date:** April 10, 2026

---

Hey Brandon and Jonathan,

Here's a full rundown of everything that's been built and shipped on apollohomebuilders.com this week. This is a big one — the public website, the SCOPS command center, and the ad infrastructure are all live and operational. Real customer data goes in on Monday.

---

## The Public Website — apollohomebuilders.com

The full marketing site is live. Here's what's built:

**Core Pages**
- **Homepage** — full brand experience with property search, floor plan previews, blog section, FAQ strip, and email capture for the Buyer's Guide. All CTAs route to the right destinations.
- **Find Your Home** (`/find-your-home`) — dedicated homes and lots browsing page with live listings, map view, and property detail cards.
- **Get in Touch** (`/get-in-touch`) — 3-step progressive lead capture form (name/contact → timeline/budget/financing → Calendly booking). Every submission lands directly in SCOPS and triggers an alert email to the team.
- **Floor Plans** (`/floor-plans`) — filterable grid of all 9 floor plans (beds, sqft, price). Each plan has a detail page with site plan image and a PDF email gate.
- **Blog** (`/blog`) — three published posts live: *Why Pahrump is Nevada's Best-Kept Secret*, *What to Expect During Your Apollo Home Build*, and *The Case for Multi-Family Builds in Southern Nevada*.
- **FAQs** (`/faqs`) — 14 Q&As across 4 categories with Google rich results schema markup.
- **Buyers Guide Thank You** (`/buyers-guide-thank-you`) — post-opt-in page with PDF download, share buttons, and blog post links.

**Lead Magnet Pages** (each has its own URL, nav, and email capture)
- `/pahrump-home-buyers-guide` — landing page for the 2026 Pahrump Home Buyer's Guide PDF with opt-in form. Footer link updated.
- `/listing-alerts` — email opt-in for new property alerts via Resend.
- `/pahrump-vs-las-vegas` — visual comparison table with email gate on the full PDF.
- `/free-lot-analysis` — intake form + Calendly embed for lot analysis consultations.
- `/floor-plans` — also functions as a lead magnet (PDF request email gate on each plan detail page).

**Email & PDF**
- The **2026 Pahrump Home Buyer's Guide PDF** (11 pages, 6 chapters) is live. Phone number updated to (775) 910-7771 throughout. Delivered automatically via Resend when someone opts in.
- Confirmation emails go out on every form submission. Tour confirmations include a `.ics` calendar attachment.
- Weekly tour digest emails go to the SCOPS team every Sunday at 6pm PT.

**Brand**
- Logo fixed across all pages — white owl + "HOMES BY / APOLLO" wordmark on navy navs, black version on white navs.
- Phone number (775) 910-7771 is consistent across all 9 files, the PDF, and the schema.org metadata.
- YouTube channel assets generated: banner (2048×1152), profile picture (800×800), watermark (150×150).

---

## SCOPS — Your Internal Command Center

Login: **apollohomebuilders.com/admin-login**
Your email + password: Pahrump2026!$#
Change your password after first login → Settings → your profile.

SCOPS is the operations layer behind the website. Every lead, property, campaign, and automation runs through it. Here's what each tab does:

---

### Dashboard Tab
Your morning briefing. Opens to a live KPI row showing:
- Units Available / Under Contract / Sold (30d)
- Revenue Closed MTD
- Tours This Week
- Active Pipeline count

Below the KPIs: Pipeline Funnel with stage conversion rates, Revenue Forecast (30/60/90 day), Inventory Health (slow-moving listings, zero-tour properties), Source Performance (which channels are generating leads), and Activity Feed (every new lead, tour, note, and stage change in real time).

**The one habit that matters most:** Check the Dashboard first thing every morning. The KPI row tells you the state of the business in 10 seconds.

---

### Pipeline Tab
Every active lead in one place. The view is a Kanban board — one column per stage:

`New Inquiry → Qualified → Tour Scheduled → Toured → Offer Submitted → Under Contract → Closed`

**Deals at Risk** appears at the top of this tab — any lead that hasn't been contacted in 48+ hours is flagged in red. These need a follow-up call within the hour. That single habit is the biggest driver of conversions.

What you can do from Pipeline:
- **Drag a card** to move a lead to a new stage
- **Click a card** to open the full lead profile (contact info, activity log, tour history, attachments, follow-ups, contracts, notes)
- **Add a note** from the lead profile in one click
- **Schedule a tour** directly from the lead profile — it opens a Calendly popup pre-filled with the lead's name and email, sends a confirmation email with a calendar invite, and automatically moves the lead to Tour Scheduled
- **Send a bulk email** to all leads in a stage (compose sheet in the column header)
- **Quick-add a lead** from the + button in any column header

Lead cards show: name, score badge (0–100), primary property interest, last activity timestamp, and a red "OVERDUE" banner if 48h has passed without contact.

---

### Inventory Tab
Every home and lot we have. 42 listings live right now.

Two views:
- **List view** — sortable table with status filters (Available, Under Contract, Sold, Coming Soon). Edit button on each row opens the full property edit form.
- **Map view** — all geocoded listings as pins on Google Maps. Pins cluster as you zoom out (navy count badges). Click a pin to see the property card. Use this to show buyers what's available in their target area.

From the Inventory tab you can:
- Add a new property (+ New Property button)
- Edit any listing (images, price, beds/baths/sqft, description, PDF links)
- Upload property photos via drag-and-drop (stored on S3)
- Geocode all listings with one click (Geocode All button)

---

### Campaigns Tab
Marketing hub. Three sections:

**Lead Magnets board** — shows all 5 lead magnet pages with live Plausible data: visitors, leads captured, and conversion rate. Click any row to open a side panel with a day-by-day traffic chart. Period toggle: 7d / 30d / Month.

**Blog Posts** — manage all published and draft posts. Create, edit, schedule, publish, and unpublish from here. Each post has a live word count, read-time estimator, and SEO score widget. Cover image upload is built in.

**UTM Builder** — generate tracked URLs for every ad, email, and social post. All UTM parameters are captured on form submissions and stored with each lead so you can see exactly which campaign generated which lead.

**Email Sequences** — create multi-step drip sequences for lead nurturing (new leads, post-tour follow-up, etc.).

Ads go live this week. Once they're running, check the Lead Magnets board daily — it will show which pages are converting traffic from the ads.

---

### Email Tab
Full email marketing module. Three sub-tabs:

- **Lists** — create and manage contact lists. New leads are automatically added to the "All Leads" list on submission.
- **Campaigns** — compose, schedule, and send email campaigns to any list. Status badges: Draft / Scheduled / Sent.
- **Analytics** — sent / opened / clicked / bounced KPIs per campaign, plus unsubscribe rate.

One-click unsubscribe is built in and RFC-compliant.

---

### Scheduling Tab
Upcoming Calendly appointments pulled live from the Calendly API. When a buyer books a tour, it appears here automatically and the lead's pipeline stage updates to Tour Scheduled. Send Weekly Digest button in the header fires the Sunday tour summary email on demand.

---

### Floor Plans Tab (`/scops/floor-plans`)
Manage all floor plan listings from here — no DB access needed. You can:
- Add / edit / delete floor plans
- Upload hero images and PDF files (drag-and-drop, stored on S3)
- Set pricing, beds/baths/sqft, description
- Mark plans as Featured (appears first on the public page)
- View PDF request leads per plan

---

### Engine Tab
Automations overview. These run on their own — you don't need to touch this daily.

Active automations:
- **New Lead Welcome Email** — fires within 60 seconds of every form submission
- **Stale Lead Alert** — emails the assigned rep when a lead hasn't been contacted in 48 hours (threshold configurable in Settings)
- **Tour Confirmation Email** — fires when a tour is scheduled, includes .ics calendar attachment
- **Weekly Tour Digest** — every Sunday at 6pm PT, sends the week's upcoming tours to the team
- **Scheduled Blog Posts** — auto-publishes posts at their scheduled time (checks every 5 minutes)
- **Resend Audience Sync** — new leads are automatically added to the Buyers Guide email list

Live stats on the Engine tab: subscriber count, open rate, click rate (pulled from Resend).

---

### Settings Tab
- **Stale Lead Threshold** — set how many hours before a lead is flagged as at-risk (default: 48h)
- **Email Notification Toggle** — turn stale lead alerts on/off per rep
- **Send Test Alert** — fires a sample alert email to your inbox so you can confirm delivery
- **Change Password** — update your login credentials

---

## What's Coming Next

**This week:**
- Google Ads go live (campaigns are written and ready to paste in)
- Meta Business Manager setup + Pixel installation
- Google Business Profile creation and verification

**Next week:**
- Meta Lead Form ads launch (Monday)
- Aria — AI SMS lead response agent (responds to inbound texts from ads as "Aria from Homes by Apollo," books tours automatically, hands off to the team when needed)
- Zapier webhook to auto-import Meta Lead Form submissions directly into SCOPS Pipeline

---

Questions? Text or call me directly.

**Kyle**
(702) 701-1064
kyle@apollohomebuilders.com
