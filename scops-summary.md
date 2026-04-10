# SCOPS — Internal Command Center Summary

**SCOPS** (Sales, Customer Operations, and Pipeline System) is the internal dashboard for Apollo Home Builders. It is accessible at `/scops` after logging in with an `@apollohomebuilders.com` admin account. All data shown is live from the production database.

---

## The 6 Tabs

| Tab | URL | What It Does |
|-----|-----|-------------|
| **Dashboard** | `/scops` | Morning briefing — KPI strip, Channel Performance chart, Lead Funnel, Goals tracker, and Activity Feed |
| **Pipeline** | `/scops/pipeline` | Kanban board of every active lead by stage. **Deals at Risk** panel at the top flags any lead overdue for follow-up. Drag cards to advance stages; click a card for the full lead profile, tour scheduling, and note-taking |
| **Inventory** | `/scops/properties` | Map + list view of all 42 listings. Geocoded pins with status color-coding (green = available, amber = under contract, red = sold). Clustered markers group nearby listings as you zoom out. Filter by type (home/lot) and status |
| **Floor Plans** | `/scops/floor-plans` | Admin table for managing the floor plan catalog — create, edit, and delete plans; upload images and PDFs directly to S3; view PDF lead counts per plan; toggle featured status and sort order |
| **Campaigns** | `/scops/campaigns` | Four sub-tabs: **Overview** (Channel Performance, Lead Funnel, Lead Magnets board with Plausible traffic + CRM lead counts + conversion rates, Goals), **Content** (Blog post management with scheduled publishing), **Email** (Resend list and sequence management), **UTM** (link builder with templates for Google, Meta, Instagram, and email) |
| **Engine** | `/scops/engine` | Automation control panel — stale lead re-engagement emails, tour reminders, listing alert broadcasts, and blog auto-publish scheduler. Runs on its own; shows last-run timestamps and logs |

---

## Deals at Risk

The **Deals at Risk** panel lives at the top of the Pipeline tab. It surfaces any lead that has not been contacted within the expected follow-up window for their current stage. Each card shows the lead's name, current stage, last contact date, and a color-coded urgency indicator. Clicking a card opens the full lead profile.

**The single most important daily habit:** check Deals at Risk first thing every morning and call any flagged lead within the hour. This one action has the highest correlation with conversion rate.

---

## Lead Magnets Board (Campaigns → Overview)

The Lead Magnets board tracks the five lead capture pages on the public site. For each page it shows Plausible visitor counts (for the selected period: 7d / 30d / Month), CRM lead captures, and a color-coded conversion rate. Clicking any row opens a side panel with a day-by-day visitor chart for that page, making it easy to spot traffic spikes from ad campaigns.

| Lead Magnet | URL |
|-------------|-----|
| Home Buyer's Guide | `/buyers-guide` |
| Listing Alerts | `/listing-alerts` |
| Pahrump vs Las Vegas | `/pahrump-vs-las-vegas` |
| Free Lot Analysis | `/free-lot-analysis` |
| Floor Plans | `/floor-plans` |

---

## User Roles

SCOPS has two roles: `admin` and `user`. Admins have full access to all tabs including destructive operations (delete property, delete floor plan, manage users). Standard users can view and edit but cannot delete. Role is set in the database and can be changed via the Database panel in the Manus Management UI.

---

## Daily 5-Minute Routine

1. Open **Dashboard** — scan KPIs and Activity Feed for anything urgent.
2. Open **Pipeline → Deals at Risk** — call any flagged lead immediately.
3. Drag any leads whose stage has changed to the correct column.
4. Done. The Engine handles everything else automatically.

---

## Login

**URL:** `apollohomebuilders.com/admin-login`
**Email:** Your `@apollohomebuilders.com` address
**Password:** Set on first login — change it immediately in Settings → Profile.

