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

## UI Polish (Session 6)
- [x] Add /crm nav link visible only when admin is logged in
- [x] Increase body/description paragraph text to 16-18px on desktop
- [x] Extend SectionLabel accent line from 32px to 48px
- [x] Change welcome email sender from app@ to hello@apollohomebuilders.com
- [x] Fix search bar stacked filters (icon and label should be inline, not stacked)
- [x] Add Apollo logo and wordmark to global footer

## Footer & Nav Redesign (Session 7)
- [x] Update nav logo to white version (white owl + white wordmark)
- [x] Rebuild footer with dark green luxury style (matching Residence O reference)
- [x] Integrate newsletter signup visually into footer (not a separate strip)
- [x] Remove "Why Pahrump" from footer links
- [x] Wire footer newsletter "Notify Me" to Resend via newsletter.subscribe tRPC endpoint
- [x] Promote owner account to admin role in database
- [x] Auto-promote 3 admin emails on login: kyle@apollohomebuilders.com, brandon@apollohomebuilders.com, kyle@workplaypartners.com

## Footer Refinements (Session 8)
- [x] Change footer background from dark green to navy (#0f2044)
- [x] Adjust APOLLO letter-spacing in footer lockup to match width of "HOMES BY" above it
- [x] Update "About Us" footer link to scroll to the About section anchor
- [x] Remove from footer nav: Updates, Warranty, Schedule, Homes for Sale, Available Lots, Floor Plans
- [x] Restructure footer top band: logo+tagline+email form on left, Call Us Free + phone + address on right (matching reference image)

## UI Polish (Session 9)
- [x] Restyle FAQ section: full-width grey rows, + icon right, large heading left, dark green "View All FAQs" button top-right
- [x] Tighten APOLLO letter-spacing in footer wordmark to form a justified lockup with HOMES BY

## FAQ Content Update (Session 10)
- [x] Replace placeholder FAQ questions with Apollo-specific content (financing, build timeline, lot availability, warranty)
- [x] Expand full FAQ page to 14 questions across 4 categories (Pricing & Financing, The Build Process, Lots & Location, Warranty & After Move-In)

## Session 11
- [x] Fix hero subtitle "Explore our listings..." to render on a single line on desktop (nowrap)
- [x] Add Plausible Analytics <script> tag to index.html
- [x] Add Plausible API tRPC procedure to fetch weekly traffic stats server-side
- [x] Add web traffic KPI cards to CRM dashboard (unique visitors, pageviews, top source, form conversion rate)
- [x] Add IP-based rate limiter to leads.submit (5 submissions per IP per hour)

## Session 12
- [x] Fix APOLLO letter-spacing in footer wordmark to visually match width of "HOMES BY" line
- [x] Increase footer nav link font sizes to match the green-background footer style
- [x] Restyle Dashboard nav link as "Admin" button with orange border + white background, left of "Schedule a Consultation"

## Session 13
- [x] Footer wordmark: increase "HOMES BY" size, make it white, match visual width of "APOLLO"

## Session 14
- [x] Add Admin link to mobile hamburger dropdown (visible to logged-in admins only)
- [x] Increase footer tagline font size by 30% (15px → ~19.5px)
- [x] Add Source breakdown bar chart to CRM dashboard showing leads by source
- [x] Add getSourceCounts DB helper and dashboardStats procedure update

## Session 15
- [x] Add time-period toggle (7d / 30d / all-time) to Lead Source chart in CRM
- [x] Update getSourceCounts DB helper to accept optional period filter
- [x] Add persistent Admin link to mobile site footer
- [x] Request Plausible API key secret

## Session 16
- [x] Change "Notify Me" button label to "Subscribe" and make it Carolina Blue (#4B9CD3)
- [x] Make footer tagline white and remove the em dash

## Session 17
- [x] Restyle hero search bar: individual grey-bordered segments, white bg, taller, solid dark Search button
- [x] Add navy Featured Properties section below hero image with Apollo property cards

## Session 18
- [x] Convert Featured Properties to horizontal carousel: 1.5 cards visible, split text/photo layout, circular arrow advance button

## Session 19
- [x] Widen site to 1680px container, remove narrow/boxed layouts, standardize horizontal padding across all sections

## Session 20
- [x] Resize How It Works cards to 515×480 (width 515px, image height 480px)
- [x] Resize main hero image to 1650×720 (maxWidth 1650px, height 720px)
- [x] Remove stat pills (50+ Homes Built, $389K Starting Price, 6–9 mo Build Time, 100% All-Inclusive)
- [x] Resize nav logo + wordmark to ~325×52 (icon 52px, HOMES BY 17px, APOLLO 30px)
- [x] Resize Featured Property carousel cards to 960×530 (cardW 960px, minHeight 530px)
- [x] Constrain "Homes by Apollo" photo-clip header (above About section) to 1650px width
- [x] Add "Homes by Apollo" photo-clip header inside Blog/Insights section at 1650px width

## Session 22
- [x] Blog card images resized to 515×336 on desktop with cover cropping
- [x] Blog grid updated to repeat(3, 515px) columns with 28px gap
- [x] Blog cards scale responsively: 2-col at ≤1200px, 1-col at ≤768px
- [x] Section label changed from "Insights" to "Latest Blog"
- [x] Section heading changed from "From the Blog" to "Stay updated with our latest articles"
- [x] Category tag and read time/date moved to same row in card content area

## Session 23
- [x] Photo-clip "Homes by Apollo" headers: background set to transparent (both instances), max-width 1650px, margin 0 auto
- [x] Footer top band, middle nav band, and bottom bar each wrapped in max-width:1650px centered inner container
- [x] Footer navy background and full-bleed watermark preserved; only content width constrained to 1650px

## Session 37
- [x] Add `properties` table to Drizzle schema (HOME/LOT, tag, price, beds, baths, sqft, imageUrl, featured flag, sortOrder)
- [x] Run `pnpm db:push` — migration applied successfully (drizzle/0003_mean_black_queen.sql)
- [x] Add CRUD helpers to server/db.ts: getFeaturedProperties, getAllProperties, getPropertyById, createProperty, updateProperty, deleteProperty
- [x] Create server/routers/properties.ts with public getFeatured/getAll/getById and admin-only create/update/delete procedures
- [x] Register propertiesRouter in appRouter
- [x] Wire Featured Properties carousel to trpc.properties.getFeatured.useQuery() with graceful fallback to hardcoded data when DB is empty
- [x] Null-safe property detail rows (Garage/Area hidden when not set)
- [x] Section labels font size increased to 19px (+45%)
- [x] Nav logo marginBottom:7px added

## Session 38
- [x] Fix JSX syntax error in ApolloSite.tsx (missing closing paren on home-detail conditional block)
- [x] Add Plausible custom event tracking to all key CTA buttons (Schedule Consultation, View Homes & Lots, Search, View All →, hero CTAs)
- [x] Build /crm/properties admin page: full CRUD table, Featured toggle, add/edit/delete modals, KPI cards
- [x] Register /crm/properties route in App.tsx
- [x] Add "Properties" nav link to CRMDashboard header

## Session 39
- [x] Update featured property photos with Pahrump-style desert/ranch imagery
- [x] Increase About Us feature item title font size by 20% (16px → 19.2px)
- [x] Increase About Us feature item description font size by 20% (14.5px → 17.4px)

## Session 40
- [x] Add kyle@kylekelly.co and brandon@lvservicesolutions.com to admin auto-promote list
- [x] Build /crm/blog admin page with add/edit/delete blog posts
- [x] Register /crm/blog route in App.tsx
- [x] Add "Blog Posts" nav link to CRMDashboard header
- [x] Register blog router in server/routers.ts
- [x] Global footer added to all sub-pages (Homes, Lots, FAQ, Blog, Contact, Home Detail, Lot Detail)

## Session 41
- [x] Replace Mesquite floor plan image with Pahrump-style desert home photo
- [x] Replace Sunrise floor plan image with Pahrump-style desert home photo
- [x] Replace Ridgeline floor plan image with Pahrump-style desert home photo

## Session 42
- [x] Increase How It Works step title and description font sizes by 25%

## Session 43 — SEO Optimization
- [x] Add full meta tags (title, description, keywords, author, robots)
- [x] Add Open Graph tags (og:title, og:description, og:image, og:url, og:type)
- [x] Add Twitter Card meta tags
- [x] Add JSON-LD structured data (LocalBusiness, RealEstateAgent, FAQPage)
- [x] Add canonical URL tag
- [x] Add sitemap.xml
- [x] Add robots.txt
- [x] Improve semantic HTML (aria-label on nav, descriptive alt text on gallery images)
- [x] Add geo meta tags for Pahrump, NV local SEO
