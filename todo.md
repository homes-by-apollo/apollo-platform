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

## Session 44 — Mobile Layout Fixes
- [x] Reduce nav height from 136px to 72px on mobile, scale logo (65→44px) and wordmark
- [x] Reduce section vertical padding to 40px on mobile (section-pad class applied to all sections)
- [x] Fix h1/h2/p typography scale on mobile (h1: clamp(28,8vw,42px), h2: clamp(24,7vw,34px), p: 16px)
- [x] Stack About Us features vertically (why-apollo-icons: 1fr on mobile)
- [x] Stack About Us grid (why-apollo-grid: 1fr on mobile)
- [x] Fix container padding to 20px on mobile (site-container)
- [x] Hide decorative photo-clip SVG headline on mobile
- [x] Reduce blog section top padding (107px → 40px on mobile)
- [x] Fix Featured Properties carousel cards to stack vertically on mobile
- [x] Fix How It Works cards to full width with reduced image height (480→220px) on mobile
- [x] Fix featured-props-section overlap padding on mobile
- [x] Add section-pad class to Featured Homes, How It Works, Available Lots, Testimonials, Blog, FAQ sections

## Session 45 — Mobile Cards, Headline & Buttons
- [x] Property/lot cards: 1-per-row grid with 24px gap on mobile
- [x] Blog cards: 1-per-row grid on mobile
- [x] Masked "Homes by Apollo" SVG headline: scale down to 60px height on mobile (shown, not hidden)
- [x] Property card images: 220px height, object-fit cover on mobile
- [x] CTA buttons: full-width on mobile (section View All, FAQ, CTA banner, contact submit, Explore More, Our Properties)

## Session 46 — Mobile Hero & Search Improvements
- [x] Stack hero content vertically with centered text on mobile
- [x] Convert search bar to vertical stacked form on mobile (48px height, 16px font, 12px gap)
- [x] Reduce hero image height to 320px on mobile (full-bleed, no border-radius)
- [x] Scale masked "Homes by Apollo" SVG headline to 52px height on mobile with 20px/30px margins
- [x] Improve nav CTA buttons: flex layout, smaller font/padding on mobile (via hamburger menu)

## Session 47 — Mobile Premium Polish
- [x] Global mobile spacing: section 48px top/bottom, container 20px sides
- [x] Typography rhythm: h1 34px/1.15, h2 28px/1.2, h3 22px/1.3, p/li 16px/1.6
- [x] Premium property/blog/lot cards: 16px border-radius, 220px images, 18px content padding
- [x] Property price: 24px/700 on mobile; title/blog-title/lot-title: 20px/1.3
- [x] Better tap targets: min-height 52px on buttons, FAQ rows; btn full-width, 12px radius, 16px font
- [x] Hero cleanup: hero-content gap 20px centered; hero image 320px full-bleed
- [x] Masked headline: 46px height SVG strip, 16px top margin, 32px bottom margin, centered
- [x] About features: 1-col grid, 20px gap; h4 18px; p 16px/1.6

## Session 48 — Mobile Refinements Round 4
- [x] Fix masked "Homes by Apollo" headline: white or transparent background (not photo-clipped on mobile)
- [x] Search form: 16px padding, white bg, 14px radius, shadow, 50px inputs, 52px button
- [x] Property cards: 26px/700 price, 14px/0.75 opacity meta, 0 8px 22px card shadow
- [x] Section headers: 22px margin-bottom, h2 8px margin-bottom
- [x] Masked headline: 40px top and bottom margin on mobile, white background
- [x] Footer subscribe: column flex, 10px gap, 48px input and button height

## Session 49 — Mobile Hero Search Card
- [x] Add hero-search class to search wrapper and style as white card (bg white, 16px padding, 16px radius, shadow, 20px margins, z-index 2) on mobile

## Session 50 — Desktop Property Card Typography
- [x] Property title: 22px / font-weight 600 / line-height 1.3 / margin-bottom 6px
- [x] Property price: 30px / font-weight 700 / letter-spacing -0.3px / margin-bottom 14px
- [x] Property meta: 15px / line-height 1.6 / opacity 0.75
- [x] Property specs table: 15px / label font-weight 500
- [x] Card content area: 20px top padding (open layout, no box)

## Session 51 — Content Copy
- [x] Change Homes for Sale section tag from "Featured Properties" to "Ready to move in"

## Session 52 — Featured Properties Card Restyle
- [x] 2-column split card: left panel (details) + right panel (full-height image)
- [x] Left panel: title 24px/700 wrapping, address below title, price 34px/700
- [x] Specs table: icon + label left, value right, horizontal dividers between rows
- [x] Icons for Bedrooms, Bathrooms, Garage, Area
- [x] Right panel: full-height image, object-fit cover, status tag top-left (white pill)
- [x] Replaced large floating arrow with compact 44px nav pills at bottom-right of image
- [x] Entire card clickable with hover lift effect
- [x] "View Details →" text CTA in blue below specs table

## Session 53 — Newsletter Subscribe Section
- [x] Insert newsletter section between Available Lots and Client Stories
- [x] Style with Apollo navy/gold color scheme, grid-pattern background, rounded card, email input + Subscribe Now button

## Session 54 — Mobile Newsletter Fix
- [x] newsletter-panel: full-width, 40px/24px padding, 16px border-radius on mobile
- [x] newsletter h2/p: 26px/1.15 h2, 16px/1.6 p with 16px/20px margins on mobile
- [x] Email input: full-width, 56px height, 14px radius, stacked above button on mobile
- [x] nl-form button: full-width, 56px height, 14px radius on mobile

## Session 55 — Mobile Search Card Position Fix
- [x] Move search card above hero image on mobile — CSS order: headline(1), subtitle(2), search(3), image(4)

## Session 56 — Wire Hero Search Bar
- [ ] Add real dropdown options to Location, Property type, and Budget fields
- [ ] Wire dropdown state with useState hooks
- [ ] Pass filter values as URL query params on Search click (?location=&type=&budget=)
- [ ] Read query params on homes/listings page and apply as filters to displayed listings

## Session 56 — Wire Hero Search Bar
- [x] Add searchLocation, searchType, searchBudget state variables
- [x] Replace static label divs with real select dropdowns (Location: Pahrump/Nye County/Las Vegas; Property: Home/Lot/Custom; Budget: Under $300k/$300-400k/$400-500k/$500k+)
- [x] Wire Search button: navigate to "lots" if type=lot, else "homes"
- [x] Apply budget filter on homes page (filter homes array by price range)
- [x] Show active filter pills on homes page with Clear filters button
- [x] Show empty state with Clear Filters CTA when no homes match

## Session 57 — Bulk Insert Live Listings from pahrumpbuilder.com
- [x] Scraped all 20 home listings and 15 lot listings from pahrumpbuilder.com
- [x] Bulk-inserted all 35 listings into the database via seed-properties.mjs
- [x] Marked first 3 homes as featured for the carousel
- [x] Wired Homes page to read from DB (dbHomes via trpc.properties.getAll)
- [x] Wired Lots page to read from DB (dbLots via trpc.properties.getAll)
- [x] Wired homepage Available Lots section to use DB data (first 3 lots)
- [x] Budget and tag filters applied to DB data on Homes page
- [x] Loading states added to Homes and Lots pages

## Session 58 — Finish the Website
- [ ] Pull property photos from pahrumpbuilder.com and upload to CDN
- [ ] Update property DB records with CDN image URLs
- [ ] Set up consultation scheduling (booking form with DB + confirmation email)
- [ ] Wire welcome/confirmation email for contact form submissions
- [ ] Wire welcome/confirmation email for consultation bookings
- [ ] Wire confirmation email for newsletter signups
- [ ] Checkpoint and publish to apollohomebuilders.com custom domain
- [ ] Test authentication for Kyle and Brandon
- [ ] Verify admin access for both users

## Session 59 — Finish the Website

### Photos
- [ ] Scrape all property images from pahrumpbuilder.com (homes + lots)
- [ ] Upload images to CDN via manus-upload-file --webdev
- [ ] Update DB property records with CDN image URLs

### Auth (Email/Password replacing Manus OAuth)
- [ ] Build email/password login page at /login
- [ ] Add localUsers table to schema (email, passwordHash, role, name)
- [ ] Wire login/logout tRPC procedures with JWT session cookie
- [ ] Create admin accounts for kyle@apollohomebuilders.com and brandon@apollohomebuilders.com
- [ ] Protect /crm/* routes with email/password auth
- [ ] Keep public site (homepage, homes, lots, contact) fully public

### Calendly Scheduling
- [ ] Add Schedule a Consultation page with Calendly inline widget
- [ ] Wire "Schedule a Consultation" nav/CTA buttons to the scheduling page
- [ ] Embed: https://calendly.com/kyle-apollohomebuilders/30min

### Resend Emails
- [ ] Verify hello@apollohomebuilders.com domain in Resend
- [ ] Send welcome/confirmation email on contact form submission
- [ ] Send confirmation email on newsletter signup
- [ ] Send admin notification email when new inquiry arrives

### Publishing
- [ ] Checkpoint before publish
- [ ] Guide Namecheap DNS setup for apollohomebuilders.com
- [ ] Publish to apollohomebuilders.com

## Session Current
- [ ] Update footer phone number to (775) 363-1616
- [ ] Fix Calendly URL to kyle-apollohomebuilders/30min and add Calendly JS widget script
- [ ] Verify Homes & Lots inventory tab switcher is working
- [ ] Connect Resend API key and build real newsletter subscription + welcome email
- [ ] Scrape property photos from pahrumpbuilders.com and upload to CRM

## Session Current — Admin Button & User Accounts
- [x] Move Admin button from top nav to footer (visible to logged-in admins only)
- [x] Remove Admin button from top nav
- [x] Confirm brandon@apollohomebuilders.com and kyle@apollohomebuilders.com are in admin auto-promote list

## Property Migration from pahrumpbuilder.com
- [ ] Scrape all property listings from pahrumpbuilder.com
- [ ] Download all property images
- [ ] Upload images to CDN
- [ ] Insert all properties into CRM database
- [ ] Verify migration in CRM
- [ ] Fix property card images to use CRM imageUrl (preserve hero image)
- [ ] Fix Schedule a Consultation page: Calendly renders above footer
- [ ] Fix Homes & Lots page: show all listings in one combined view (no tabs)

## Homepage Inventory Fixes
- [x] Replace stock photo home cards on homepage with real CRM inventory data and images
- [x] Move Available Lots section to appear directly after Homes for Sale on homepage

## Admin Login Page
- [x] Create /admin-login page with Apollo branding and email/password sign-in
- [x] Update footer Admin link to point to /admin-login instead of /crm directly
- [x] Add adminCredentials table to schema (email, passwordHash, name)
- [x] Build adminAuth tRPC router (login, logout, me) with bcrypt + JWT cookie
- [x] Protect /crm, /crm/properties, /crm/blog with adminAuth session check
- [x] Set ADMIN_KYLE_HASH and ADMIN_BRANDON_HASH secrets

## Session Current — Logo, Logout, Publish
- [x] Upload new Apollo horizontal logo to CDN
- [x] Replace old logo on /admin-login page with new horizontal logo
- [x] Add logout button to CRM Dashboard header
- [x] Add logout button to CRM Properties header
- [x] Add logout button to CRM Blog header
- [x] Save checkpoint and publish to apollohomebuilders.com

## Forgot Password Flow
- [ ] Add passwordResetTokens table to schema (token, email, expiresAt, usedAt)
- [ ] Build adminAuth.requestReset tRPC endpoint (generates token, sends Resend email)
- [ ] Build adminAuth.resetPassword tRPC endpoint (validates token, updates hash, marks used)
- [ ] Build /forgot-password page (email input form)
- [ ] Build /reset-password page (new password + confirm form, reads ?token= from URL)
- [ ] Add "Forgot password?" link to /admin-login page
- [ ] Register new routes in App.tsx

## Admin Button & Login Page Fixes
- [x] Fix Admin button in footer — make it always visible (not gated on isAdmin)
- [x] Remove subtitle text "Sign in to manage listings, leads, and site content." from /admin-login
- [x] Increase logo size by 50% on /admin-login page

## UI Polish
- [x] Reverted testimonial avatars back to original photos (illustrated avatars cancelled per user request)
- [x] Fix mobile search bar stacking (filters should stack cleanly on small screens)

## Bug Fixes
- [x] Fix footer appearing at top of individual home/lot detail pages instead of bottom

## Nav & Auth Updates
- [x] Update nav button: "View Homes & Lots" → "FIND YOUR HOME" (all caps)
- [x] Update nav button: "Schedule a Consultation" → "GET IN TOUCH" (all caps, light blue font)
- [x] Build /forgot-password page (email input, sends reset link via Resend)
- [x] Build /reset-password page (token validation, new password form)
- [x] Add "Forgot Password?" link on /admin-login page
- [x] Wire both pages into App.tsx router

## Search Bar & Nav Button Fixes
- [x] Set Pahrump, NV as default location in search bar
- [x] Fix search bar container sizing (too small, Search button overlaps)
- [x] Fix search filter logic to correctly surface matching properties
- [x] Increase nav button font size by 20% on desktop (GET IN TOUCH, FIND YOUR HOME)

## Plausible Analytics Integration
- [x] Store PLAUSIBLE_API_KEY as secret
- [x] Build server-side tRPC endpoint to proxy Plausible Stats API v1 (visitors, pageviews, bounce rate, avg visit, top pages, top sources, timeseries)
- [x] Add Analytics section to CRM Dashboard with live Plausible data, period selector (7d/30d/Mo/6mo/12mo), daily sparkline, top pages table, top sources bar chart
- [x] Fix existing analytics tests to match new field names (visitors7d→visitors, topSource→topSources)

## Testimonial Font Size
- [x] Increase all testimonial text by 25% (quote text, name, role/label)

## Mobile Fixed Button Update
- [ ] Update mobile fixed bottom CTA buttons: "Schedule a Free Consultation" → "GET IN TOUCH" (light blue), "View Homes" → "FIND YOUR HOME" (navy)

## Mobile Fixed Bar Updates
- [x] Update mobile fixed bottom CTA buttons: "Schedule a Free Consultation" → "GET IN TOUCH" (light blue), "View Homes" → "FIND YOUR HOME" (navy)
- [x] Remove Admin button from mobile fixed bottom bar (keep only in footer)

## YouTube Channel Assets & Navigation Pages
- [x] Remove "Custom Build" option from homepage search bar property type dropdown
- [x] Remove/update "custom homes" language across site (taglines, descriptions, footers)
- [x] Generate YouTube channel banner (2048x1152) — revised without Custom Homes
- [x] Generate YouTube profile picture (800x800)
- [x] Generate YouTube video watermark (150x150)
- [x] Create /get-in-touch page (dedicated contact/schedule page)
- [x] Create /find-your-home page (dedicated homes & lots browsing page)
- [x] Wire GET IN TOUCH button (desktop + mobile) to navigate to /get-in-touch URL
- [x] Wire FIND YOUR HOME button (desktop + mobile) to navigate to /find-your-home URL
- [x] Register /get-in-touch and /find-your-home routes in App.tsx

## YouTube Channel Assets & Navigation (Current Session)
- [x] Generate YouTube channel banner (2048x1152) consistent with Homes by Apollo brand owl logo
- [x] Generate YouTube profile picture (800x800) with owl on navy circle
- [x] Generate YouTube video watermark (150x150) with owl on navy
- [x] Remove "Custom Build" option from homepage search bar property type dropdown
- [x] Remove all "custom home builder" / "custom build" copy from site (replaced with "new home builder")
- [x] Create /get-in-touch dedicated page (renders ApolloSite with contact section pre-selected)
- [x] Create /find-your-home dedicated page (renders ApolloSite with homes section pre-selected)
- [x] Update all nav buttons (desktop, mobile menu, mobile sticky bar) to push real URLs via wouter
- [x] Register /get-in-touch and /find-your-home routes in App.tsx

## Admin Credentials & Resend (Current Session)
- [x] Set RESEND_API_KEY secret for email delivery
- [x] Set ADMIN_KYLE_HASH secret (Pahrump2026!$#)
- [x] Set ADMIN_BRANDON_HASH secret (Pahrump2026!$#)
- [x] Add jonathan@apollohomebuilders.com to seedAdmins list
- [x] Set ADMIN_JONATHAN_HASH secret (Pahrump2026!$#)
- [x] Write and pass vitest for credential hash validation (35 tests pass)
- [x] Verify apollohomebuilders.com domain in Resend (required for password reset emails)

## Auth Overhaul — DB-Backed Credentials (Current Session)
- [x] Remove env-var hash lookups from adminAuth router (ADMIN_KYLE_HASH, ADMIN_BRANDON_HASH, ADMIN_JONATHAN_HASH)
- [x] Update adminCredentials table to be the single source of truth for all admin logins
- [x] Seed all three accounts (kyle, brandon, jonathan) with hashed password directly into DB via migration script
- [x] Update login procedure to query adminCredentials table only
- [x] Add Admin Users management page in CRM (/crm/users): list admins, add new admin, change password, delete
- [x] Wire add/change-password forms to new tRPC procedures (no env vars, no manual hashing)
- [ ] Update forgot-password and reset-password flows to use DB tokens
- [x] Run all tests and confirm 35 pass (8 test files)

## Auth Fix — Cookie Parser (Current Session)
- [x] Identified root cause: req.cookies was undefined because cookie-parser middleware was missing
- [x] Installed cookie-parser package
- [x] Added app.use(cookieParser()) to server/_core/index.ts
- [x] Verified all three admin logins work: kyle, brandon, jonathan with Pahrump2026!$#
- [x] All 35 tests passing (8 test files)

## Auth Fix — Cookie Parser (Current Session)
- [x] Identified root cause: req.cookies was undefined because cookie-parser middleware was missing
- [x] Installed cookie-parser package
- [x] Added app.use(cookieParser()) to server/_core/index.ts
- [x] Verified all three admin logins work: kyle, brandon, jonathan with Pahrump2026}#
- [x] All 35 tests passing (8 test files)

## Current Session — Email + UTM
- [x] Send test email to kyle@apollohomebuilders.com via Resend
- [x] Wire contact form confirmation email (buyer receives reply on submit) — already wired, confirmed working
- [x] Add UTM parameter capture to /get-in-touch and /find-your-home
- [x] Store utm_source, utm_medium, utm_campaign, utm_content, utm_term, landingPage with each lead submission

## Current Session — UTM Chart + URL Builder + Resend Button
- [x] Add UTM source breakdown chart to CRM dashboard
- [x] Build UTM URL builder page in the CRM
- [x] Add Resend welcome email button to lead detail view

## SCOPS Rebrand (CRM → SCOPS)

- [ ] Rename all /crm routes to /scops in App.tsx
- [x] Add /crm/* → /scops/* redirect middleware in Express server
- [ ] Rename CRMDashboard.tsx → SCOPSDashboard.tsx
- [ ] Rename CRMProperties.tsx → SCOPSProperties.tsx
- [ ] Rename CRMBlog.tsx → SCOPSBlog.tsx
- [ ] Rename CRMUsers.tsx → SCOPSUsers.tsx
- [ ] Rename CRMUtmBuilder.tsx → SCOPSUtmBuilder.tsx
- [x] Replace all "CRM" text with "SCOPS" across all pages
- [x] Update product name to "APOLLO SCOPS" in all headers/titles
- [ ] Update AdminLogin redirect from /crm to /scops
- [ ] Update server-side CRM references (email subjects, comments)
- [ ] Standardize navigation across all SCOPS modules with consistent layout
- [ ] Fix Calendly integration — add webhook handling and event sync to SCOPS
- [ ] Add Calendly appointments table to schema
- [ ] Create SCOPS Scheduling page showing upcoming Calendly appointments
- [ ] Run full regression tests after rebrand

## Session Apr 6 — Calendly + Blog + Footer
- [ ] Add CALENDLY_API_KEY secret and auto-register Calendly webhook
- [ ] Build /blog as standalone public page (not homepage state)
- [ ] Fix footer position (not anchored to bottom of page)

## Blog + Digest + Tour Linking (Apr 6 2026)
- [ ] Fix /blog footer to match homepage footer exactly
- [ ] Set navy blue (#0f2044) background on "From the Blog" section in ApolloSite homepage
- [ ] Build weekly tour digest email (Sunday evenings) to SCOPS team
- [ ] Add SCOPS team management (Kyle super admin, Brandon, Jonathan) for digest recipients
- [ ] Send Kyle a test tour digest email
- [ ] Add Schedule Tour button to lead detail page pre-filled with contact info

## Session Apr 6 — Blog Footer + Digest + Tour Linking (COMPLETED)
- [x] Fix /blog footer to match homepage footer exactly
- [x] Set navy blue (#0f2044) background on "From the Blog" section in ApolloSite homepage
- [x] Build weekly tour digest email (Sunday evenings, 6pm PT) to SCOPS team
- [x] SCOPS team configured: Kyle, Brandon, Jonathan (from scopsTeam table)
- [x] Send Kyle a test tour digest email — confirmed delivered
- [x] Add Schedule Tour button to lead detail page pre-filled with contact info
- [x] Register Calendly webhook at apollohomebuilders.com/api/webhooks/calendly
- [x] Add Send Weekly Digest button to SCOPS Scheduling page header
- [x] Fix context.ts to authenticate apollo_admin_session cookie for adminProcedure
- [x] All 36 tests passing

## Session Apr 6 — SCOPS Nav Logo
- [x] Add Apollo owl logo to SCOPS DashboardLayout nav top left

## Blog Content — Three Posts (Apr 6 2026)
- [x] Research Pahrump real estate data, Nevada housing stats, multi-family investment trends
- [x] Generate charts: Pahrump median home price trend, cost-of-living comparison, multi-family cap rate data
- [x] Write Blog 1: "Why Pahrump is Nevada's Best-Kept Secret for New Home Buyers" (943 words)
- [x] Write Blog 2: "What to Expect During Your Apollo Home Build" (911 words)
- [x] Write Blog 3: "The Case for Multi-Family Builds in Southern Nevada" (904 words)
- [x] Save all three as drafts in SCOPS blog CMS (not published)
- [x] Add status (draft/published) column to blogPosts schema + migration
- [x] Add Publish/Unpublish button to SCOPS Blog table
- [x] Public blog queries now filter to published-only; admin sees all

## Blog Enhancements (Apr 6 2026 — Session 2)
- [x] Add slug field to blogPosts schema + migration
- [x] Add author field to blogPosts schema + migration
- [x] Update db helpers and router for slug-based lookup + author
- [x] Remove em dashes from all three blog post bodies
- [x] Update public /blog/:slug route (clean URLs)
- [x] Add related posts widget to blog post detail page
- [x] Add slug + author fields to SCOPS Blog form
- [x] Add blog post preview modal in SCOPS Blog
- [x] Publish all three blog posts

## Blog UX Enhancements (Apr 6 2026 — Session 3)
- [x] Add OG meta tags (og:title, og:description, og:image, og:url, twitter:card) to blog post detail page
- [x] Add Share button to blog post detail page: copy-to-clipboard URL, LinkedIn share link, X share link
- [x] Add blog post creation shortcut to SCOPS home dashboard

## Blog Editor Enhancements (Apr 6 2026 — Session 4)
- [x] Wire ?new=1 query param in SCOPSBlog to auto-open the new post form
- [x] Add Copy Share Link button to SCOPS Blog table rows
- [x] Add live word count + read-time estimator to SCOPS Blog editor

## SCOPS Nav + Blog Enhancements (Apr 6 2026 — Session 5)
- [x] Update SCOPS global nav: Logo | Dashboard | Pipeline | Inventory | Marketing | Content | Operations | Admin | Kyle dropdown
- [x] Add lastEditedBy + lastEditedAt fields to blogPosts schema + migration
- [x] Show Last Edited By column in SCOPS Blog table
- [x] Add scheduledPublishAt field to blogPosts schema + migration
- [x] Add scheduled publish date picker to blog post form
- [x] Add auto-publish cron that checks for scheduled posts every 5 minutes
- [x] Add SEO score widget to blog editor (keyword check in title/excerpt/body)

## Homepage Email Capture Redesign (Apr 6 2026)
- [x] Generate embossed 2026 Home Buyer's Guide book image
- [x] Create Resend "Buyers Guide" audience list (ID: 8281a905-19a8-4e2c-9711-ef6b67318d1f)
- [x] Update newsletter.subscribe endpoint to add contacts to Buyers Guide list
- [x] Redesign homepage email capture section: two-column layout, new copy, book image
- [x] Update CTA button to gold "Download Free Guide" (was navy "Subscribe Now")
- [x] Update success message to "Check your inbox! Your guide is on its way."
- [x] Mobile responsive: book stacks above form on small screens

## Book Image Revision (Apr 6 2026)
- [x] Regenerate book image: slim luxury guide flat on marble, large "2026 PAHRUMP HOME BUYER'S GUIDE" title, small owl/wordmark
- [x] Upload to CDN and update homepage section src URL

## Buyers Guide PDF + Homepage Enhancements (Apr 6 2026)
- [x] Update book container background to light marble/off-white so book image blends seamlessly
- [x] Add "What's inside" bullet list below form copy on homepage email capture section
- [x] Generate 2026 Pahrump Home Buyer's Guide as a polished multi-page PDF (11 pages, 6 chapters)
- [x] Upload PDF to S3 CDN
- [x] Attach PDF download link (gold button) to Resend confirmation email

## SCOPS Dashboard Redesign — Apple macOS Tahoe (Apr 6 2026)
- [ ] Add deals table to schema (stage, expected_close_date, amount, property_id, lead_id)
- [ ] Add lead_property_interest table (lead_id, property_id, interest_level, view_count)
- [ ] Update contact pipeline stages to: New Inquiry, Qualified, Tour Scheduled, Toured, Offer Submitted, Under Contract, Closed
- [ ] Run db:push migration
- [ ] Add db helpers: getDashboardKPIs, getPipelineFunnel, getRevenueForecast, getInventoryHealth, getDemandSignals, getDealsAtRisk, getSourcePerformance, getActivityFeed, getActivePipeline
- [ ] Add tRPC procedures for all new dashboard queries
- [ ] Redesign SCOPSDashboard.tsx: Apple white/minimal design system
- [ ] KPI row: Units Available, Under Contract, Units Sold (30d), Revenue Closed MTD, Tours This Week, Absorption Rate
- [ ] Pipeline funnel: new stages with count + conversion %
- [ ] Revenue Forecast panel: 30/60/90 day from deals.expected_close_date
- [ ] Inventory Health section: slow-moving, recently reduced, low activity
- [ ] Demand Signals section: most viewed/toured/saved properties
- [ ] Deals at Risk section: 48h no contact, no follow-up, stalled offers
- [ ] Source Performance table: Source | Leads | Tours | Contracts | Revenue
- [ ] Activity Feed: new lead, tour scheduled, deal created, property updated
- [ ] Active Pipeline table: name, stage, score, primary property, last activity, next action
- [ ] Remove website analytics (traffic) from dashboard (move to Marketing)

## SCOPS Dashboard Redesign — Apple macOS Tahoe (Apr 6 2026 — COMPLETED)
- [x] Add dashboard tRPC router with overview query (inventory stats, tours, absorption, forecast, at-risk, inventory health, source perf, activity)
- [x] Add DB helpers: getInventoryStats, getToursThisWeek, getAbsorptionRate, getRevenueForecast, getDealsAtRisk, getInventoryHealth, getSourcePerformance, getRecentActivity
- [x] Redesign SCOPSDashboard.tsx: Apple white/minimal design system (solid white bg, rounded-2xl cards, thin borders, no shadows)
- [x] KPI row: Units Available, Under Contract, Units Sold (30d), Revenue Closed MTD, Tours This Week, Absorption Rate
- [x] Quick Actions row: New Blog Post, Add Lead, Schedule Tour, View Properties, UTM Builder
- [x] Deals at Risk section: 48h no-contact leads with inline View action
- [x] Pipeline funnel: stages with count bars + conversion %
- [x] Revenue Forecast panel: 30/60/90 day bar chart from deals.expected_close_date
- [x] Source Performance table: Source | Leads | Tours | Contracts
- [x] Activity Feed: recent activity log with contact names and timestamps
- [x] Inventory Health: Slow Moving (60+ DOM) and Low Activity Listings panels
- [x] Active Pipeline table: name, stage, score, property, timeline, last activity, next action
- [x] All 35 tests passing

## SCOPS Dashboard Glassmorphism Redesign (Apr 6 2026)
- [x] Rewrite SCOPSDashboard.tsx: frosted glass / liquid blue macOS aesthetic matching mockup
- [x] Gradient blue background (fixed attachment, multi-stop blue/periwinkle)
- [x] GlassCard component: rgba white, backdrop-filter blur, white border, soft shadow
- [x] KPI cards with colorful gradient progress bars and delta badges
- [x] Pipeline Funnel with gradient blue bars matching mockup color palette
- [x] Revenue Forecast with vertical bar chart + total forecast row
- [x] Inventory Health: Slow Moving, Most Demanded, Recently Reduced with property images
- [x] Deals at Risk: numbered cards with red Follow-Up button
- [x] Source Performance table with emoji source icons
- [x] Activity Feed with avatar initials and timestamps
- [x] Active Pipeline table with glass-style row hover
- [x] SCOPSNav: frosted glass bar, live clock + date top-left, centered tabs with glass active state, no Apple logo
- [x] All 35 tests passing, zero TypeScript errors

## Operator Priority Dashboard Upgrade (Apr 6 2026)
- [x] Elevate Deals at Risk as primary action center (below KPI row, full-width, alert styling, lead name + property + issue + time + CTA)
- [x] Pipeline Funnel: add conversion % between stages, drop-off indicators, bottleneck highlights
- [x] Revenue Forecast: fix empty states — show "No upcoming closings" + active deal count if no data
- [x] Inventory Health: fix passive empty states, add DOM/leads/tours per row, highlight zero-tour and high-DOM
- [x] Rename Active Pipeline → "Today's Focus", sort by urgency/score/recency, add primary property + last activity + next action columns
- [x] KPI cards: add micro-signals (trend indicator, vs last period context)
- [x] Increase information density, reduce vertical whitespace

## Apr 6 2026 — Multi-task batch
- [ ] Enlarge buyer's guide book image by 50%
- [ ] Rebuild Pipeline tab as Liquid Glass kanban conversion workspace
- [ ] Send buyers guide PDF to kyleryankelly@gmail.com
- [ ] Test email capture form with kyle@kylekelly.co

## Apr 6 2026 — Homepage polish
- [ ] Add Plausible guide_download custom event on buyer's guide form submit
- [ ] Add 900px breakpoint for stacked buyer's guide layout
- [ ] Add Instagram link in global footer

## Apr 6 2026 — Site-wide polish batch
- [ ] Upload composited book cover (owl + hero + gold) and swap URL in newsletter section
- [ ] Add Instagram CTA ("Follow @homesby.apollo") below footer email form in brand column
- [ ] Track footer_subscribe in Plausible on footer form success
- [x] Connect home page blog cards to their article URLs
- [x] Scan entire site for pages missing global footer (get-in-touch, find-your-home, all blog pages/posts, about, contact, etc.)
- [x] Apply global footer to all non-SCOPS pages missing it

## Apr 7 2026 — Footer & Blog fixes
- [x] Update Calendly embed URL to https://calendly.com/d/cyjg-rx9-q39/meeting?hide_event_type_details=1 (height 700px)
- [x] Replace all inline footers in ApolloSite.tsx with GlobalFooter component (homes, lots, home-detail, lot-detail, FAQ, contact pages)
- [x] Replace inline footer in PublicBlog.tsx with GlobalFooter
- [x] Replace inline footer in PublicBlogPost.tsx with GlobalFooter
- [x] Update homepage blog card static images to match actual published post images from DB
- [x] Add slugs to static blog fallback data so cards link to correct articles
- [x] Blog cards on homepage now link to /blog/{slug} with hover animation
- [x] Blog card images in PublicBlog.tsx updated to match published post images

## Apr 7 2026 — SCOPS Tab Redesigns + Footer Polish
- [x] Add Instagram CTA ("📸 Follow @homesby.apollo") to GlobalFooter below subscribe form
- [x] Add footer_subscribe Plausible event on footer form success
- [x] Redesign SCOPS Pipeline tab — Liquid Glass kanban (lead list + map + detail panel)
- [x] Redesign SCOPS Inventory tab — map-centric view with lead cards and property detail panel
- [x] Redesign SCOPS Marketing tab — Channel Performance, Campaign Leaderboard, Landing Pages, UTM Builder
- [x] Redesign SCOPS Content tab — Blog Posts table with KPI cards and Landing Pages panels

## Apr 7 2026 — SCOPS Liquid Glass Design System
- [x] Add .glass, .glass-card, .glass-panel, .glass-hover CSS primitives to index.css (SCOPS-only)
- [x] Create GlassCard.tsx reusable component
- [x] Create GlassPanel.tsx reusable component
- [x] Create KpiCard.tsx reusable component
- [x] Create PipelineCard.tsx reusable component
- [x] Refactor SCOPSDashboard to use GlassCard/GlassPanel/KpiCard
- [x] Refactor SCOPSPipeline to use GlassCard/PipelineCard
- [x] Refactor SCOPSProperties (Inventory) to use GlassCard/GlassPanel
- [x] Apply dark radial gradient body background to all SCOPS pages (Dashboard, Pipeline, Inventory, Marketing, Content)

## Apr 7 2026 — SCOPS Pipeline Live Data Build
- [x] Audit schema: add nextActionDueAt to contacts, isPrimaryInterest/rankOrder to leadPropertyInterest, INQUIRED to interestLevel enum
- [x] Add pipeline.list tRPC procedure (live leads with stage/search filters)
- [x] Add pipeline.leadDetail tRPC procedure (full lead payload)
- [x] Add pipeline.summary tRPC procedure (totalActive, atRisk, toursThisWeek, newThisWeek, stageCounts)
- [x] Add pipeline.quickCreate tRPC procedure (fast lead creation from Pipeline)
- [x] Add pipeline.updateStage tRPC procedure
- [x] Add pipeline.addActivity tRPC procedure
- [x] Create StageFilterBar.tsx component
- [x] Create LeadDetailPanel.tsx component with profile, activity, tours, next action blocks
- [x] Rewrite SCOPSPipeline.tsx with live tRPC data, click-to-select detail panel, stage filter bar, quick add sheet
- [x] Add KPI summary bar (Total Leads, At Risk, Tours This Week, New This Week)
- [x] Fix dark glass right panel
- [x] Write vitest for pipeline router (39 tests passing)

## Apr 7 2026 — Pipeline CRM, CSS Tokens, Admin Refactor, Home Buyers Guide
- [x] Upload new Home Buyers Guide cover image to CDN and update homepage newsletter section
- [x] Update PDF cover page to new Home Buyers Guide design
- [x] Upgrade index.css with full Liquid Glass token system (OKLCH tokens, status tokens, stage tokens, glass utilities)
- [x] Wire pipeline.leadDetail to click-to-select right panel
- [x] Add drag-to-move stage on Pipeline lead cards (onDragEnd → pipeline.updateStage)
- [x] Add Schedule Tour quick action to LeadDetailPanel
- [x] Refactor Admin tab into user dropdown with Admin Controls section
- [x] Build Admin Users workspace (AdminUsersTable, AdminInspectorPanel, InviteAdminSheet)
- [x] Add roles system (Super Admin, Admin, Marketing, Sales) with permissions

## Apr 7 2026 — Pipeline Kanban + Inventory Redesign (from mockups)
- [x] Redesign Pipeline tab as Kanban board (horizontal stage columns, liquid glass cards, drag-to-move)
- [x] Pipeline right panel: wire pipeline.detail for full data (activity log, tours, property interests, next action)
- [x] Add Schedule Tour quick action button to LeadDetailPanel
- [x] Redesign Inventory tab: Channel Performance + Campaign Leaderboard + UTM Builder + Map layout
- [x] Apply light Apple liquid glass background to ALL SCOPS pages (Dashboard, Pipeline, Inventory, Marketing, Content, Scheduling, Users)

## Apr 7 2026 — Admin Refactor, Kanban Columns, Score Badges
- [x] Move Admin nav item into user dropdown in SCOPSNav
- [x] Build SCOPSAdmin page with AdminUsersTable + InviteAdminSheet
- [x] Add roles system (Super Admin, Admin, Marketing, Sales) to user table + procedures
- [x] Redesign Pipeline as true horizontal Kanban (one column per stage, all visible simultaneously)
- [x] Add lead score badge chip to Pipeline Kanban cards

## Apr 7 2026 — Kanban Enhancements + Role-Gated Nav
- [x] Per-column Add Lead (+) button in Kanban column header (pre-fills QuickAddSheet with stage)
- [x] Kanban card collapse/expand: show top 5 by urgencyScore, "Show N more" expand button for 10+ leads
- [x] Role-gated nav items: hide Marketing/Content from sales role, hide Pipeline/Scheduling from marketing role

## Apr 7 2026 — Edit Lead Panel, Search Dimming, Tour Email
- [x] Edit Lead inline form in LeadDetailPanel (name, phone, budget, financing, assigned rep)
- [x] Kanban search highlight dimming (dim non-matching cards, don't hide them)
- [x] Tour confirmation email via Resend with .ics calendar attachment on Schedule Tour
- [x] Update phone number to (775) 363-1616 throughout Buyers Guide PDF and re-upload to CDN

## Apr 7 2026 — Pipeline Quick Note, Overdue Highlights, Email Blast
- [x] Quick-note input at bottom of LeadDetailPanel (pipeline.addActivity type NOTE)
- [x] Overdue lead red banner on Kanban card (isOverdue flag from pipeline.list)
- [x] Overdue count badge on Kanban column header
- [x] Send-to-Stage email blast: leads.sendBulkEmail server procedure
- [x] Compose sheet in column header ("Send to Stage" button opens subject/body form)

## Apr 7 2026 — Blog Image Fix, SCOPS Background, Cron, Bulk Move, Analytics
- [x] Replace apartment complex blog image with house-framing/build confidence photo
- [x] Apply new liquid glass wave background (.webp) to all SCOPS pages
- [x] Lead re-engagement cron job: flag stale leads + Resend alert to assigned rep
- [x] Bulk stage-move: checkboxes on Kanban cards + Move Selected to Stage action bar
- [x] Pipeline analytics conversion rate widget above Kanban columns

## Apr 7 2026 — Thank-You Page, Blog CTA Rebrand, Conversion Drill-Down
- [x] Add /buyers-guide-thank-you page (PDF cover preview, what's-inside strip, three blog posts, bottom CTA)
- [x] Wire newsletter form success to redirect to /buyers-guide-thank-you
- [x] Rebrand blog CTA background from dark navy to bright amber/gold gradient on PublicBlogPost.tsx
- [x] Conversion rate drill-down: clicking a bar in analytics widget filters Kanban to that stage (click again to clear)

## Apr 7 2026 — Homepage Polish, SCOPS Dark Glass, Thank-You SEO, Stale Threshold
- [x] Homepage: increase "All-Inclusive Pricing", "Local Pahrump Expertise", "Flexible Floor Plans", "Preferred Lenders" font size by 4pt
- [x] Homepage: left-align buyers guide email form with the text above/below it
- [x] Homepage FAQ: update section header, 5 FAQ items, and add "Ready to see what's available?" bottom CTA
- [x] Thank-you page: add react-helmet OG meta tags (title, description, og:image)
- [x] SCOPS Admin: stale lead threshold setting (DB table + procedure + /scops/settings page)
- [x] SCOPS Dashboard: apply dark liquid glass design system (new dark background, dark glass tokens, white text)

## Apr 7 2026 — Lead Capture Refactor, FAQ Page, SCOPS Typography
- [x] Refactor Get In Touch page: 2-step progressive form (Name+Phone/Email → Timeline+Budget+Financing+Message)
- [x] Get In Touch: new headline/subhead/value bullets, social proof star rating, calendar post-submit
- [x] Get In Touch: mobile-first layout (form first, contact info below, sticky CTA)
- [x] Get In Touch: SCOPS API integration (leads.submit with source, stage, lead score, smart routing)
- [x] Get In Touch: property context auto-fill from URL param
- [x] Homepage: mid-page lead capture embed after property listings section
- [x] Build /faqs page with hero, 14 Q&As across 4 categories, final CTA
- [x] Wire "View All FAQs →" link on homepage FAQ to /faqs
- [x] SCOPS typography refactor: Inter/Figtree font, CRM Pro hierarchy (page titles, section headers, card labels, metrics, table headers/body)
- [x] Blog index CTA: amber/gold "Start Your Apollo Home Journey" block on PublicBlog.tsx
- [x] SCOPS Settings: email notification toggle (enable/disable stale-lead Resend alerts)

## Apr 7 2026 — SCOPS Nav Cleanup
- [x] Remove Operations tab from SCOPS navigation
- [x] SCOPS top nav: increase tab font size by 4pt (13px → 17px)

## Apr 7 2026 — SCOPS Nav Polish
- [x] SCOPS nav: increase minHeight from 56px to 64px
- [x] SCOPS nav: bump user chip first-name font from 13px to 15px
- [x] SCOPS nav: add amber/gold 2px bottom border accent on active tab
- [x] Promote Kyle to Super Admin role in adminCredentials
