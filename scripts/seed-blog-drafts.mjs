/**
 * Seed the three Apollo blog post drafts into the database.
 * Run with: node scripts/seed-blog-drafts.mjs
 */
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "../.env") });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const connection = await mysql.createConnection(DATABASE_URL);
const db = drizzle(connection);

const blog1Body = `**Published by Apollo Home Builders | Pahrump, NV**

---

![New construction homes in Pahrump, Nevada with desert landscaping and mountain views](https://d2xsxph8kpxj0f.cloudfront.net/310419663032182609/mwVy9Am3ywXkRkqF68TJjK/pahrump-home1_9c98ce21.jpg)

Most people who move to Nevada head straight for Las Vegas or Henderson. They know the name, they know the skyline, and they assume that is where the opportunity is. But a growing number of buyers are discovering something the locals have known for years: Pahrump, Nevada offers everything that drew people to the Las Vegas Valley in the first place, at a fraction of the cost, with room to breathe.

Situated just 60 miles west of the Strip, Pahrump sits in a wide valley flanked by the Spring Mountains to the east and the Nopah Range to the west. The views are extraordinary. The pace is unhurried. And the numbers, increasingly, are hard to ignore.

## The Price Gap Is Real — and It Is Widening in Your Favor

The median home price in Pahrump reached $410,000 in early 2026, up 10.8% year-over-year according to Redfin. That sounds like a lot until you compare it to the Las Vegas metro, where the median has climbed to approximately $480,000 — a gap of roughly $70,000 for comparable square footage. For a buyer putting 20% down, that difference represents over $14,000 in immediate equity and meaningfully lower monthly payments.

![Pahrump vs. Las Vegas Median Home Price 2019–2026](https://d2xsxph8kpxj0f.cloudfront.net/310419663032182609/mwVy9Am3ywXkRkqF68TJjK/chart1_home_prices_2634ccf4.png)
*Sources: Redfin, Zillow, ATTOM Data (2026)*

What the chart above shows is not just a snapshot — it is a trajectory. Pahrump prices rose from roughly $195,000 in 2019 to $410,000 today, a 110% increase over seven years. Buyers who purchased new construction in Pahrump in 2019 have seen their equity more than double. Those entering today are doing so at a point where the community's infrastructure and amenities have matured considerably, while the price gap with Las Vegas remains substantial.

## The Cost of Living Advantage Goes Beyond the Purchase Price

Buying a home is a one-time transaction. Living in it is a daily one. Pahrump's overall cost of living index sits at approximately 81 on a scale where the US average is 100, according to data from BestPlaces.net and erieri.com. Las Vegas, by contrast, registers around 107. That 26-point spread compounds over time.

![Cost of Living Index: Pahrump vs. Las Vegas vs. US Average](https://d2xsxph8kpxj0f.cloudfront.net/310419663032182609/mwVy9Am3ywXkRkqF68TJjK/chart2_cost_of_living_ba03668f.png)
*Sources: BestPlaces.net, erieri.com (2025)*

Housing costs in Pahrump index at 72 — meaning they run 28% below the national average. Utilities, groceries, and transportation all come in below or near the national baseline. For a household spending $5,000 per month on living expenses, the difference between Pahrump and Las Vegas can amount to $1,300 or more per month.

Nevada's broader tax environment amplifies this further. No personal income tax, no estate tax, and property tax rates among the lowest in the western United States. For retirees, remote workers, and families relocating from California or the Pacific Northwest, the financial case is compelling.

## A Community That Has Grown Up

One of the most common misconceptions about Pahrump is that it is too remote or underdeveloped for everyday life. That was a fair critique fifteen years ago. It is not accurate today.

Pahrump has a population approaching 48,000 residents as of 2026, growing at 1.52% annually. The community supports a full complement of daily services: grocery chains, medical facilities including a hospital, a regional airport, schools, and a growing commercial corridor along Highway 160. Employment grew 10% from 2023 to 2024, according to DataUSA, reflecting genuine economic expansion rather than just residential spillover from Las Vegas.

The commute to Las Vegas takes approximately 50 to 60 minutes. For remote workers and retirees, that distance is not a constraint — it is a feature. Access to world-class entertainment, healthcare, and international air travel is available when needed, without the daily noise and cost of living inside the metro.

## New Construction Is the Right Entry Point

Existing inventory in Pahrump tends to be older stock, often built in the 1990s and early 2000s with the maintenance needs that come with that age. New construction changes the calculus entirely. A newly built home in Pahrump means modern energy efficiency, current building codes, builder warranties, and the ability to customize finishes to your preference — all in a community that is actively growing rather than stagnating.

![New construction homes in Pahrump, NV](https://d2xsxph8kpxj0f.cloudfront.net/310419663032182609/mwVy9Am3ywXkRkqF68TJjK/pahrump-home2_255c36e5.jpg)

Apollo Home Builders has been building in Pahrump because the fundamentals are sound. Land is available at prices that allow for thoughtfully designed homes with generous lot sizes. The regulatory environment in Nye County is builder-friendly. And the buyers coming to Pahrump are families, retirees, and remote professionals who intend to stay — the kind of stable community that holds its value over time.

## The Window Is Open — But It Will Not Stay That Way

Markets like Pahrump do not stay secrets forever. The same story played out in Henderson in the 1990s, in Summerlin in the 2000s, and in North Las Vegas in the 2010s. Each of those communities was once considered too far out, too underdeveloped, too much of a compromise. Each became a desirable address as infrastructure caught up with demand and prices reflected that maturity.

Pahrump is earlier in that curve. The infrastructure investment is happening now. The population is growing. The price gap with Las Vegas remains wide. For buyers who are willing to look past the familiar names and evaluate the fundamentals, Pahrump is not a compromise. It is a head start.

---

*Ready to explore what's available in Pahrump? [Schedule a tour with Apollo Home Builders](/get-in-touch) and see our current new construction homes firsthand.*

---

**Sources:** Redfin Pahrump Housing Market (2026) | Zillow Home Values Pahrump NV (2026) | ATTOM Data Pahrump NV | BestPlaces.net Cost of Living Calculator | erieri.com Cost of Living Pahrump NV | World Population Review Pahrump 2026 | DataUSA Pahrump NV Profile`;

const blog2Body = `**Published by Apollo Home Builders | Pahrump, NV**

---

![New home construction foundation and framing in Nevada desert](https://d2xsxph8kpxj0f.cloudfront.net/310419663032182609/mwVy9Am3ywXkRkqF68TJjK/construction-nv_97a4405b.jpg)

Building a new home is one of the most significant financial decisions a person makes. It is also one of the most misunderstood. Most buyers have purchased existing homes before — they know the inspection, the negotiation, the closing. But a new construction build is a different process entirely, with its own rhythm, milestones, and decision points. Understanding what happens at each stage removes the anxiety and puts you in control.

At Apollo Home Builders, we believe an informed buyer is a confident buyer. Here is an honest, straightforward walkthrough of what the process looks like from the day you sign your contract to the day you receive your keys.

## Phase 1: Pre-Construction (Weeks 1–6)

The build does not begin the moment you sign. Before a single shovel touches the ground, a significant amount of work happens behind the scenes: lot selection and survey, design consultations, permit applications, and financing finalization.

Your first major decision point is the design meeting. This is where you select your floor plan, exterior finishes, interior materials, cabinetry, countertops, flooring, and fixture packages. Apollo's design process presents curated options within each category, so you are selecting from combinations that work together aesthetically and structurally — not navigating an open-ended catalog.

Permit timelines in Nye County typically run two to four weeks. During that window, your construction manager is coordinating subcontractor schedules, ordering materials, and confirming site utility connections.

## Phase 2: Site Preparation and Foundation (Weeks 6–9)

Once permits are approved, work begins on your lot. Site prep involves grading the land, establishing drainage, and marking the footprint of your home. In the Pahrump Valley, soil conditions are generally favorable for construction, though a site-specific soils report guides the foundation design.

The foundation is poured as a monolithic or stem-wall slab, depending on your plan. Concrete cures over several days, and inspections are conducted before framing begins. This is a milestone worth visiting in person — seeing the footprint of your home laid out on the ground makes the floor plan tangible in a way that blueprints cannot. Your construction manager will notify you when the foundation is cleared for framing.

## Phase 3: Framing (Weeks 9–13)

Framing is the phase that transforms a slab into a structure. Walls go up, the roof takes shape, and for the first time, you can walk through the actual rooms of your future home. A typical single-family home in our portfolio can be framed in two to three weeks under normal conditions.

This is also the last opportunity to make structural modifications before the build advances. Questions about room dimensions, window placement, or ceiling heights need to be raised here — changes become significantly more complex once mechanical systems are installed. A framing inspection by the Nye County Building Department occurs at the end of this phase.

## Phase 4: Mechanical, Electrical, and Plumbing (Weeks 13–18)

Once framing is approved, the trades move in. Plumbers run supply and drain lines. Electricians rough in the panel and circuits. HVAC contractors install ductwork and the air handler. This phase is often called the "rough-in" stage, where the systems that make a home livable are installed inside the walls before they are closed.

Nevada's climate demands a well-designed HVAC system. Pahrump summers regularly exceed 105°F, and a properly sized system is not optional. Apollo specifies high-efficiency units with SEER ratings appropriate for the desert climate, with all ductwork sealed and insulated to minimize energy loss. Each trade is subject to its own inspection before drywall is hung.

## Phase 5: Insulation and Drywall (Weeks 18–22)

Insulation is installed in exterior walls, ceilings, and select interior walls for sound attenuation. In the Pahrump climate, insulation quality is a direct driver of long-term utility costs. Apollo uses packages that meet or exceed Nevada Energy Code requirements. Drywall follows immediately after insulation inspection — hanging, taping, mudding, and finishing is a multi-week process, and the quality of this work has a significant impact on the final appearance of your home.

## Phase 6: Interior Finishes (Weeks 22–30)

This is the phase most buyers find most satisfying to visit. Cabinets are installed, countertops are templated and set, flooring goes down, tile is laid in bathrooms and kitchens, paint is applied, and trim is installed throughout. Light fixtures, plumbing fixtures, appliances, and hardware are all set during this phase.

Your selections from the design meeting come to life here. Apollo's construction manager coordinates the sequencing carefully — flooring before baseboards, countertops before backsplash, paint before fixtures — to ensure a clean, professional result.

## Phase 7: Final Inspections and Walkthrough (Weeks 30–34)

Before you receive your keys, the home undergoes a final inspection by the county building department, resulting in a Certificate of Occupancy. Apollo also conducts an internal quality review and a buyer walkthrough, during which you inspect every room, every system, and every finish with your construction manager present. Any items identified are documented and addressed before closing.

The average Apollo build runs 8 to 10 months from contract signing to keys. Your construction manager will keep you informed at every milestone so there are no surprises.

---

*Have questions about our current floor plans or build timeline? [Contact us](/get-in-touch) and we will walk you through everything.*

---

**Sources:** Shane Homes New Home Construction Stages (2025) | Brookfield Residential New Construction Process (2026) | Nevada Energy Code Residential Requirements | Nye County Building Department`;

const blog3Body = `**Published by Apollo Home Builders | Pahrump, NV**

---

![Multi-family residential development in Southern Nevada desert](https://d2xsxph8kpxj0f.cloudfront.net/310419663032182609/mwVy9Am3ywXkRkqF68TJjK/multifamily-nv_dfd486dd.jpg)

Southern Nevada has a housing problem. Not a demand problem — demand is robust, driven by population growth, in-migration from California and other high-cost states, and a labor market that has diversified well beyond the gaming and hospitality sectors that once defined the region. The problem is supply. And within that supply gap, multi-family residential construction represents one of the most compelling opportunities available to investors and developers in the market today.

The data tells a clear story. The Las Vegas metro added an estimated 44,586 residents from July 2023 to July 2024, according to U.S. Census estimates reported by the Reno Gazette-Journal. Nevada ranks consistently among the top growth states in the country. Yet apartment construction has slowed materially — Las Vegas delivered approximately 5,000 new multifamily units in 2024, a 27% drop from the prior year, according to Rockview Capital research. The math is straightforward: more people, fewer units, sustained pressure on rents and occupancy.

## The Market Correction Created a Window

The 2023–2024 period was difficult for multifamily operators in Southern Nevada. A wave of new supply permitted during the low-rate environment of 2021–2022 delivered into a market where interest rates had risen sharply, pushing vacancy rates to a peak of approximately 9.4% by late 2024, according to NAI Excel's 2025 Outlook Report.

That correction is now reversing. Vacancy declined to 5.8% in Q4 2025, according to Colliers' Q4 2025 Multifamily Market Research Report — the lowest level in over two years. The pipeline of new supply has thinned as developers paused or cancelled projects. The units that were overbuilt in 2023 have been absorbed. The market is tightening.

![Southern Nevada Multifamily: Vacancy Rate & Average Rent (2023–2025)](https://d2xsxph8kpxj0f.cloudfront.net/310419663032182609/mwVy9Am3ywXkRkqF68TJjK/chart3_multifamily_d154a3ea.png)
*Sources: Colliers Q4 2025, Cushman & Wakefield Q4 2025, Lee Associates Q2 2025*

Average asking rents in the Las Vegas Valley ran approximately $1,479 per unit in Q4 2025, per Cushman & Wakefield's MarketBeat report. Cap rates for small multifamily properties held steady at approximately 5.2% as of Q2 2025, per Lee Associates data, with valuations rising as vacancy compresses. Investors who build or acquire now are entering after the correction, as the recovery is already underway.

## Why Pahrump Specifically Makes Sense for Multi-Family

The Las Vegas metro gets most of the attention in multifamily investment conversations, but Pahrump presents a distinct and arguably more favorable case for smaller-scale multi-family development.

The rental market in Pahrump is structurally undersupplied. The community's population of nearly 48,000 has grown 25% over the past decade, but rental inventory has not kept pace. Existing rental stock tends to be older, with limited amenities. A newly constructed duplex, triplex, or small apartment building in Pahrump competes against a weak field and commands a premium accordingly.

Land costs remain significantly lower than in the Las Vegas Valley. Residential lots are available at prices that allow multi-family projects to pencil at construction costs that would be unworkable in Henderson or Summerlin. Nye County's regulatory environment is streamlined compared to Clark County, reducing permitting timelines and compliance costs. The tenant profile is also favorable: working families, retirees who prefer to rent, and workers in the growing commercial sectors along Highway 160. These are stable, long-term tenants — not the transient population that drives higher turnover in urban markets.

## The Build-to-Rent Model Is Gaining Ground in Nevada

Nationally, the build-to-rent sector has emerged as one of the fastest-growing segments of residential real estate. The model is particularly well-suited to markets like Southern Nevada where homeownership costs have risen faster than incomes. Nevada's legislature and governor have taken notice of the housing shortage. In early 2026, the state launched a housing initiative targeting middle-income affordability, according to the Associated Press. State-level support for residential construction is likely to expand as the affordability crisis deepens.

For investors considering multi-family construction in Southern Nevada, the structural case is strong. Population growth is durable. Supply is constrained. The correction that drove up vacancy in 2023–2024 has cleared. Land in Pahrump is still priced at levels that support new construction economics. And the regulatory tailwinds at the state level are moving in the right direction.

## What Apollo Home Builders Can Do for Multi-Family Investors

Apollo Home Builders is not exclusively a single-family builder. We work with investors and developers on multi-family residential projects in Pahrump and the surrounding Nye County area. Our team understands the local permitting process, the soil and site conditions in the valley, and the design requirements that make multi-family projects attractive to tenants in this market.

Whether you are considering a duplex on a single lot, a small apartment building, or a phased multi-unit development, the conversation starts with understanding your investment objectives and working backward to a build program that achieves them. The market conditions in Southern Nevada today are as favorable for multi-family construction as they have been in several years. The window is open.

---

*Interested in discussing a multi-family project in Pahrump? [Reach out to our team](/get-in-touch) and let's talk through what's possible.*

---

**Sources:** U.S. Census Bureau / Reno Gazette-Journal Nevada Population Growth (2026) | Rockview Capital Las Vegas Multifamily Investment Analysis (2025) | Colliers Las Vegas Multifamily Market Research Report Q4 2025 | Cushman & Wakefield Las Vegas MarketBeat Multifamily Q4 2025 | NAI Excel Las Vegas Market Report 2025 Outlook | Lee Associates Las Vegas Multifamily Q2 2025 | Associated Press Nevada Housing Bill (2026) | World Population Review Pahrump 2026`;

const posts = [
  {
    title: "Why Pahrump is Nevada's Best-Kept Secret for New Home Buyers",
    category: "Tips",
    excerpt: "Pahrump offers everything that drew people to the Las Vegas Valley — at a fraction of the cost, with room to breathe. Here is why the numbers are hard to ignore.",
    body: blog1Body,
    readTime: "6 min",
    imageUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310419663032182609/mwVy9Am3ywXkRkqF68TJjK/pahrump-home1_9c98ce21.jpg",
    featured: 1,
    sortOrder: 1,
    status: "draft",
  },
  {
    title: "What to Expect During Your Apollo Home Build",
    category: "Construction",
    excerpt: "A new construction build has its own rhythm, milestones, and decision points. Here is an honest walkthrough of every phase — from contract signing to keys.",
    body: blog2Body,
    readTime: "7 min",
    imageUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310419663032182609/mwVy9Am3ywXkRkqF68TJjK/construction-nv_97a4405b.jpg",
    featured: 1,
    sortOrder: 2,
    status: "draft",
  },
  {
    title: "The Case for Multi-Family Builds in Southern Nevada",
    category: "Investment",
    excerpt: "Southern Nevada has a supply problem, not a demand problem. Here is why multi-family construction in Pahrump represents one of the most compelling opportunities in the market today.",
    body: blog3Body,
    readTime: "6 min",
    imageUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310419663032182609/mwVy9Am3ywXkRkqF68TJjK/multifamily-nv_dfd486dd.jpg",
    featured: 1,
    sortOrder: 3,
    status: "draft",
  },
];

try {
  for (const post of posts) {
    const [result] = await connection.execute(
      `INSERT INTO blogPosts (title, category, excerpt, body, readTime, imageUrl, featured, sortOrder, status, publishedAt, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), NOW())`,
      [post.title, post.category, post.excerpt, post.body, post.readTime, post.imageUrl, post.featured, post.sortOrder, post.status]
    );
    console.log(`✓ Inserted: "${post.title}" (id=${result.insertId})`);
  }
  console.log("\nAll 3 blog posts inserted as drafts. Review them in SCOPS > Blog and click Publish when ready.");
} catch (err) {
  console.error("Error inserting posts:", err.message);
  process.exit(1);
} finally {
  await connection.end();
}
