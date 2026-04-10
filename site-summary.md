# ApolloHomeBuilders.com — Site Summary

**Apollo Home Builders** · Residential New Construction · Pahrump, NV

---

## What Was Built

The public-facing website at [apollohomebuilders.com](https://apollohomebuilders.com) is a full-stack marketing and lead generation platform for Apollo Home Builders. Every page is designed to capture buyer intent at different stages of the decision journey — from early research through to a booked consultation.

---

## Pages & Their Purpose

| Page | URL | Purpose |
|------|-----|---------|
| **Homepage** | `/` | Brand introduction, hero section, featured floor plans, social proof, and dual CTAs ("Get in Touch" / "Find Your Home") |
| **Get in Touch** | `/get-in-touch` | Primary contact form — name, email, phone, message. Triggers CRM lead creation and welcome email |
| **Find Your Home** | `/find-your-home` | Searchable listing browser with type/status filters and map view |
| **Floor Plans** | `/floor-plans` | Gallery of all available floor plans with bed/bath/sqft filters |
| **Floor Plan Detail** | `/floor-plans/:slug` | Individual plan page with specs, description, image, and gated PDF download (email capture) |
| **Blog** | `/blog` | SEO content hub — published posts pulled from SCOPS Blog admin |
| **Blog Post** | `/blog/:slug` | Individual article page with full content and related CTAs |
| **FAQs** | `/faqs` | Frequently asked questions about the building process in Pahrump |
| **Buyers Guide** | `/buyers-guide` | Lead magnet — free guide download gated behind email opt-in |
| **Buyers Guide Thank You** | `/buyers-guide-thank-you` | Post-conversion page with next steps and calendar booking prompt |
| **Listing Alerts** | `/listing-alerts` | Lead magnet — email subscription for new listing notifications |
| **Pahrump vs Las Vegas** | `/pahrump-vs-las-vegas` | Lead magnet — comparison content targeting Las Vegas buyers considering Pahrump |
| **Free Lot Analysis** | `/free-lot-analysis` | Lead magnet — intake form for buyers who own land and want a buildability review |

---

## Lead Capture System

Every page with a form feeds directly into the SCOPS CRM. The table below maps each page to its database table and the automated email that fires on submission.

| Page | DB Table | Auto-Email |
|------|----------|------------|
| Get in Touch | `leads` | Welcome email via Resend |
| Floor Plan PDF Request | `floorPlanRequests` | PDF link + consultation CTA |
| Buyers Guide | `newsletterSubscribers` | Guide download link |
| Listing Alerts | `listingAlertSubscribers` | Confirmation + current listings |
| Free Lot Analysis | `lotAnalysisRequests` | Confirmation + calendar link |

---

## Design System

The site uses a **navy and gold** brand palette (`#0f2044` navy, `#c9a84c` gold) with the "HOMES BY / APOLLO" wordmark and owl icon. All lead magnet pages share a consistent nav with the wordmark on the left and **GET IN TOUCH ↗** and **FIND YOUR HOME ↗** buttons on the right. The homepage nav is clean — no secondary links, just the logo and the two CTAs.

---

## Technical Stack

The site is a React 19 single-page application served by an Express 4 backend, using tRPC for type-safe API calls, Drizzle ORM with a MySQL/TiDB database, and Resend for transactional email. All static assets are hosted on S3 CDN. Analytics are tracked via Plausible.

