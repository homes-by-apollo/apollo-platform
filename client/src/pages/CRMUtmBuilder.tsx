import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

// ─── Pre-built campaign templates ─────────────────────────────────────────────

const TEMPLATES = [
  {
    label: "Google Search — Pahrump Homes",
    source: "google",
    medium: "cpc",
    campaign: "pahrump-new-homes",
    content: "search-brand",
    term: "pahrump+new+homes",
    landingPage: "/get-in-touch",
  },
  {
    label: "Google Search — Build a Home NV",
    source: "google",
    medium: "cpc",
    campaign: "nevada-home-builder",
    content: "search-generic",
    term: "build+a+home+nevada",
    landingPage: "/get-in-touch",
  },
  {
    label: "Facebook — New Homes Pahrump",
    source: "facebook",
    medium: "paid-social",
    campaign: "pahrump-new-homes",
    content: "carousel-homes",
    term: "",
    landingPage: "/find-your-home",
  },
  {
    label: "Facebook — Retargeting",
    source: "facebook",
    medium: "paid-social",
    campaign: "retargeting",
    content: "retarget-visitors",
    term: "",
    landingPage: "/get-in-touch",
  },
  {
    label: "Instagram — Home Build Story",
    source: "instagram",
    medium: "paid-social",
    campaign: "brand-awareness",
    content: "story-build",
    term: "",
    landingPage: "/find-your-home",
  },
  {
    label: "Email Newsletter",
    source: "email",
    medium: "newsletter",
    campaign: "monthly-update",
    content: "cta-button",
    term: "",
    landingPage: "/get-in-touch",
  },
  {
    label: "Billboard — Pahrump Hwy 160",
    source: "billboard",
    medium: "outdoor",
    campaign: "pahrump-hwy160",
    content: "qr-code",
    term: "",
    landingPage: "/get-in-touch",
  },
  {
    label: "Zillow Profile",
    source: "zillow",
    medium: "listing",
    campaign: "zillow-profile",
    content: "website-link",
    term: "",
    landingPage: "/find-your-home",
  },
];

const BASE_URL = "https://apollohomebuilders.com";

const LANDING_PAGES = [
  { value: "/get-in-touch", label: "/get-in-touch — Contact Form" },
  { value: "/find-your-home", label: "/find-your-home — Browse Homes" },
  { value: "/", label: "/ — Homepage" },
];

function buildUrl(params: {
  landingPage: string;
  source: string;
  medium: string;
  campaign: string;
  content: string;
  term: string;
}) {
  const qs = new URLSearchParams();
  if (params.source) qs.set("utm_source", params.source);
  if (params.medium) qs.set("utm_medium", params.medium);
  if (params.campaign) qs.set("utm_campaign", params.campaign);
  if (params.content) qs.set("utm_content", params.content);
  if (params.term) qs.set("utm_term", params.term);
  const query = qs.toString();
  return `${BASE_URL}${params.landingPage}${query ? `?${query}` : ""}`;
}

export default function CRMUtmBuilder() {
  const [landingPage, setLandingPage] = useState("/get-in-touch");
  const [source, setSource] = useState("");
  const [medium, setMedium] = useState("");
  const [campaign, setCampaign] = useState("");
  const [content, setContent] = useState("");
  const [term, setTerm] = useState("");

  const generatedUrl = useMemo(
    () => buildUrl({ landingPage, source, medium, campaign, content, term }),
    [landingPage, source, medium, campaign, content, term]
  );

  function applyTemplate(t: typeof TEMPLATES[0]) {
    setLandingPage(t.landingPage);
    setSource(t.source);
    setMedium(t.medium);
    setCampaign(t.campaign);
    setContent(t.content);
    setTerm(t.term);
  }

  function copyUrl() {
    navigator.clipboard.writeText(generatedUrl).then(() => {
      toast.success("URL copied to clipboard");
    });
  }

  function reset() {
    setLandingPage("/get-in-touch");
    setSource("");
    setMedium("");
    setCampaign("");
    setContent("");
    setTerm("");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-[#0f2044] text-white px-6 py-4">
        <h1 className="font-bold text-lg">UTM URL Builder</h1>
        <p className="text-white/60 text-xs mt-0.5">Generate tracking URLs for Google Ads, Meta, email, and other campaigns</p>
      </div>

      <div className="px-6 py-6 max-w-screen-xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left: Builder Form */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-bold text-[#0f2044] uppercase tracking-wider">Build Your URL</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Landing Page */}
              <div>
                <label className="text-xs font-semibold text-[#0f2044] block mb-1.5">
                  Landing Page <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {LANDING_PAGES.map(lp => (
                    <button
                      key={lp.value}
                      onClick={() => setLandingPage(lp.value)}
                      className={`text-xs px-3 py-1.5 rounded-full font-semibold border transition-colors ${
                        landingPage === lp.value
                          ? "bg-[#0f2044] text-white border-[#0f2044]"
                          : "bg-white text-slate-600 border-slate-200 hover:border-[#0f2044]"
                      }`}
                    >
                      {lp.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Source + Medium */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#0f2044] block mb-1.5">
                    utm_source <span className="text-red-500">*</span>
                    <span className="text-muted-foreground font-normal ml-1">(e.g. google, facebook)</span>
                  </label>
                  <Input
                    value={source}
                    onChange={e => setSource(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                    placeholder="google"
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#0f2044] block mb-1.5">
                    utm_medium
                    <span className="text-muted-foreground font-normal ml-1">(e.g. cpc, email)</span>
                  </label>
                  <Input
                    value={medium}
                    onChange={e => setMedium(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                    placeholder="cpc"
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              {/* Campaign + Content */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#0f2044] block mb-1.5">
                    utm_campaign
                    <span className="text-muted-foreground font-normal ml-1">(ad group name)</span>
                  </label>
                  <Input
                    value={campaign}
                    onChange={e => setCampaign(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                    placeholder="pahrump-new-homes"
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#0f2044] block mb-1.5">
                    utm_content
                    <span className="text-muted-foreground font-normal ml-1">(ad creative ID)</span>
                  </label>
                  <Input
                    value={content}
                    onChange={e => setContent(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                    placeholder="carousel-homes"
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              {/* Term */}
              <div>
                <label className="text-xs font-semibold text-[#0f2044] block mb-1.5">
                  utm_term
                  <span className="text-muted-foreground font-normal ml-1">(keyword, Google Ads only)</span>
                </label>
                <Input
                  value={term}
                  onChange={e => setTerm(e.target.value.toLowerCase().replace(/\s+/g, "+"))}
                  placeholder="pahrump+new+homes"
                  className="h-8 text-xs"
                />
              </div>

              {/* Generated URL */}
              <div className="pt-2">
                <label className="text-xs font-semibold text-[#0f2044] block mb-1.5">Generated URL</label>
                <div className="flex gap-2">
                  <div className="flex-1 bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-xs font-mono text-slate-700 break-all select-all">
                    {generatedUrl}
                  </div>
                  <Button
                    size="sm"
                    className="bg-[#0f2044] hover:bg-[#1a3366] text-white shrink-0 h-auto px-4"
                    onClick={copyUrl}
                  >
                    Copy
                  </Button>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={reset}
                >
                  Reset
                </Button>
                <a
                  href={generatedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#0f2044] underline self-center ml-2 hover:text-[#1a3366]"
                >
                  Preview ↗
                </a>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Pre-built Templates */}
        <div className="space-y-4">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-bold text-[#0f2044] uppercase tracking-wider">Campaign Templates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {TEMPLATES.map((t, i) => (
                <button
                  key={i}
                  onClick={() => applyTemplate(t)}
                  className="w-full text-left px-3 py-2.5 rounded-lg border border-slate-200 hover:border-[#0f2044] hover:bg-slate-50 transition-colors group"
                >
                  <div className="text-xs font-semibold text-[#0f2044] group-hover:text-[#1a3366]">{t.label}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5 font-mono">
                    {t.source}/{t.medium} → {t.landingPage}
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Quick reference */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold text-[#0f2044] uppercase tracking-wider">Parameter Guide</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-slate-600">
              {[
                ["utm_source", "Where the traffic comes from", "google, facebook, billboard"],
                ["utm_medium", "The marketing channel", "cpc, email, paid-social"],
                ["utm_campaign", "The campaign or ad group", "pahrump-new-homes"],
                ["utm_content", "The specific ad or creative", "carousel-a, story-video"],
                ["utm_term", "Paid keyword (Google only)", "pahrump+homes"],
              ].map(([param, desc, ex]) => (
                <div key={param} className="border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                  <div className="font-mono font-semibold text-[#0f2044] text-[10px]">{param}</div>
                  <div className="text-[10px] text-muted-foreground">{desc}</div>
                  <div className="text-[10px] text-slate-400 italic">e.g. {ex}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
