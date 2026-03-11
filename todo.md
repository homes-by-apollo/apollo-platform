# Apollo Home Builders — TODO

## Completed (Previous Session)
- [x] Full single-page React application built
- [x] Navy and gold color scheme
- [x] Responsive design with mobile hamburger menu
- [x] AI-generated Pahrump-specific photography
- [x] Photo-clipped "Homes by Apollo" hero text
- [x] Custom owl logo + "HOMES BY / APOLLO" wordmark in nav
- [x] Full-width layout (5vw horizontal padding)
- [x] All sections: Hero, Why Apollo, How It Works, Featured Properties, Available Lots, Blog, Testimonials, FAQ, Contact, Footer
- [x] All emoji replaced with SVG icons
- [x] Resend API key configured and validated
- [x] tRPC contact.submit endpoint built (sends email via Resend to app@apollohomebuilders.com)

## Contact Form + Mobile (Session 2)
- [x] Wire contact form UI to tRPC backend (currently only toggles local state)
- [x] Add sticky mobile CTA bar (fixed bottom button on mobile)
- [x] Replace consultation step image with AI-generated Nevada desert consultation photo
- [x] Replace emoji in contact section with SVG icons (📍 📞 ✉️ 🪪)
- [x] Add loading state and error handling to contact form

## Layout Fixes (Session 3)
- [x] Remove "Contact" link from top nav
- [x] Make all page sections full-width on desktop (remove narrow max-width containers, use consistent horizontal padding)

## Phase 1 — Lead Capture + CRM Dashboard (Session 4)
- [x] Add contacts table to drizzle schema (buyer/agent, all spec fields, lead score, pipeline stage)
- [x] Add activity_log table (stage changes, notes per contact)
- [x] Add email_log table (template, sent_at, contact_id)
- [x] Run pnpm db:push to migrate schema
- [x] Add db helpers: createContact, getContacts, getContactById, updateContact, logActivity, logEmail, getStageCounts, getNewLeadsThisWeek
- [x] Add tRPC leads router: submit (public), list (protected), getById (protected), updateStage (protected), addNote (protected), updateContact (protected), dashboardStats (protected)
- [x] Auto-calculate lead score (HOT/WARM/COLD) on create/update based on timeline + financing
- [x] Upgrade website contact form to full CRM intake (contactType toggle, timeline, priceRange, financing, brokerage)
- [x] Wire form submission to new leads.submit procedure (saves to DB + sends welcome email)
- [x] Send lead_welcome Resend email on new lead creation
- [x] Owner notification via notifyOwner on new lead
- [x] Build /crm route (protected, requires login)
- [x] CRM Dashboard page: funnel bar chart (leads by stage), KPI cards (new this week, active pipeline, hot leads, tours scheduled)
- [x] CRM Contacts table: searchable + filterable by stage, score, type
- [x] CRM Lead Detail page: all fields visible, stage selector with SQL validation, activity log, email log, add note
- [x] Write vitest for all leads procedures (12 tests across submit, list, getById, updateStage, addNote, dashboardStats)

## Pending
- [ ] Replace detail page gallery images with Pahrump build photos
- [ ] Update testimonial avatars with illustrated avatars
- [ ] Fine-tune mobile search bar stacking
- [ ] Add /crm link to website nav (visible only when logged in as admin)

## Typography Fixes (Session 5)
- [x] Increase desktop font size of all section labels (e.g. "How it works", "Available Lots", "Our approach")

## Typography Fixes (Session 5 cont.)
- [x] Increase section button sizes and fonts ("View All", "Our Properties", etc.)
- [x] Increase FAQ question font sizes in Common Questions section
