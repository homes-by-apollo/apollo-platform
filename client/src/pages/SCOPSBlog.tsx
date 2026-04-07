import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import SCOPSNav from "@/components/SCOPSNav";
import { useEffect } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

const CATEGORIES = ["Tips", "Construction", "Investment", "Finance", "Community", "News"] as const;
type Category = typeof CATEGORIES[number];

interface BlogForm {
  title: string;
  slug: string;
  author: string;
  category: Category;
  excerpt: string;
  body: string;
  readTime: string;
  imageUrl: string;
  featured: boolean;
  sortOrder: string;
  scheduledPublishAt: string; // ISO datetime-local string or ""
  seoKeyword: string; // for SEO score widget (not saved to DB)
}

const EMPTY_FORM: BlogForm = {
  title: "",
  slug: "",
  author: "",
  category: "Tips",
  excerpt: "",
  body: "",
  readTime: "5 min",
  imageUrl: "",
  featured: true,
  sortOrder: "0",
  scheduledPublishAt: "",
  seoKeyword: "",
};

const CAT_COLORS: Record<string, string> = {
  Tips: "bg-blue-100 text-blue-700 border-blue-200",
  Construction: "bg-amber-100 text-amber-700 border-amber-200",
  Investment: "bg-green-100 text-green-700 border-green-200",
  Finance: "bg-purple-100 text-purple-700 border-purple-200",
  Community: "bg-pink-100 text-pink-700 border-pink-200",
  News: "bg-gray-100 text-gray-600 border-gray-200",
};

/** Auto-generate a URL slug from a title */
function toSlug(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

// ─── Preview Modal ────────────────────────────────────────────────────────────

const NAVY = "#0f2044";
const G = "#1B3A6B";
const TXT = "#0d1b2a";
const MUT = "#6b7a99";
const BOR = "#e8edf5";
const GL = "rgba(27,58,107,0.07)";

function PreviewModal({
  post,
  onClose,
}: {
  post: { title: string; author: string; category: string; body: string; imageUrl: string; excerpt: string; readTime: string };
  onClose: () => void;
}) {
  const lines = post.body.split("\n");
  const elements: React.ReactNode[] = [];
  let key = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith("# ")) {
      elements.push(<h1 key={key++} style={{ fontSize: 26, fontWeight: 900, color: TXT, marginTop: 28, marginBottom: 10 }}>{line.slice(2)}</h1>);
    } else if (line.startsWith("## ")) {
      elements.push(<h2 key={key++} style={{ fontSize: 20, fontWeight: 800, color: TXT, marginTop: 24, marginBottom: 8 }}>{line.slice(3)}</h2>);
    } else if (line.startsWith("### ")) {
      elements.push(<h3 key={key++} style={{ fontSize: 16, fontWeight: 700, color: TXT, marginTop: 18, marginBottom: 6 }}>{line.slice(4)}</h3>);
    } else if (line.startsWith("![")) {
      const match = line.match(/!\[([^\]]*)\]\(([^)]+)\)/);
      if (match) {
        elements.push(
          <figure key={key++} style={{ margin: "20px 0", borderRadius: 10, overflow: "hidden" }}>
            <img src={match[2]} alt={match[1]} style={{ width: "100%", maxHeight: 280, objectFit: "cover" }} />
          </figure>
        );
      }
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      const items: string[] = [];
      while (i < lines.length && (lines[i].startsWith("- ") || lines[i].startsWith("* "))) {
        items.push(lines[i].slice(2));
        i++;
      }
      i--;
      elements.push(
        <ul key={key++} style={{ margin: "10px 0 10px 20px", listStyleType: "disc" }}>
          {items.map((item, j) => (
            <li key={j} style={{ fontSize: 14, color: TXT, lineHeight: 1.8, marginBottom: 4 }}>{item}</li>
          ))}
        </ul>
      );
    } else if (line.trim() === "" || line.trim() === "---") {
      // skip
    } else {
      elements.push(
        <p key={key++} style={{ fontSize: 14, color: TXT, lineHeight: 1.85, marginBottom: 14 }}>{line}</p>
      );
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: "#f7f9fc", borderRadius: 16, width: "100%", maxWidth: 760, maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column", fontFamily: "'Manrope',system-ui,sans-serif" }}>
        {/* Preview header */}
        <div style={{ background: NAVY, padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ff5f57" }} />
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#febc2e" }} />
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#28c840" }} />
            <span style={{ marginLeft: 8, fontSize: 12, color: "rgba(255,255,255,0.5)", fontFamily: "monospace" }}>apollohomebuilders.com/blog/preview</span>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.6)", fontSize: 18, cursor: "pointer", lineHeight: 1 }}>×</button>
        </div>

        {/* Scrollable content */}
        <div style={{ overflowY: "auto", flex: 1 }}>
          {/* Hero image */}
          {post.imageUrl && (
            <div style={{ width: "100%", height: 220, overflow: "hidden" }}>
              <img src={post.imageUrl} alt={post.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          )}

          <div style={{ padding: "28px 32px 40px" }}>
            {/* Category badge */}
            <div style={{ marginBottom: 12 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: G, background: GL, padding: "4px 10px", borderRadius: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>{post.category}</span>
            </div>

            {/* Title */}
            <h1 style={{ fontSize: 28, fontWeight: 900, color: TXT, lineHeight: 1.2, marginBottom: 16, letterSpacing: "-0.02em" }}>{post.title}</h1>

            {/* Meta */}
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28, paddingBottom: 20, borderBottom: `1px solid ${BOR}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 30, height: 30, borderRadius: "50%", background: G, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 12, fontWeight: 800 }}>
                  {(post.author || "A")[0].toUpperCase()}
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: TXT }}>{post.author || "Apollo Home Builders"}</span>
              </div>
              <span style={{ fontSize: 12, color: MUT }}>{post.readTime} read</span>
            </div>

            {/* Body */}
            {elements.length > 0 ? elements : (
              <p style={{ color: MUT, fontSize: 14, fontStyle: "italic" }}>No body content yet.</p>
            )}
          </div>
        </div>

        <div style={{ padding: "12px 20px", borderTop: `1px solid ${BOR}`, background: "white", display: "flex", justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ background: NAVY, color: "white", border: "none", borderRadius: 8, padding: "8px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Blog Form Modal ──────────────────────────────────────────────────────────

function BlogModal({
  initial,
  onClose,
  onSave,
  saving,
}: {
  initial: BlogForm;
  onClose: () => void;
  onSave: (form: BlogForm) => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<BlogForm>(initial);
  const set = (field: keyof BlogForm, value: string | boolean) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handleTitleChange = (title: string) => {
    setForm(prev => ({
      ...prev,
      title,
      // Auto-fill slug only if it hasn't been manually edited
      slug: prev.slug === toSlug(prev.title) || prev.slug === "" ? toSlug(title) : prev.slug,
    }));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-bold text-[#0f2044]">
            {initial.title ? "Edit Post" : "Add Blog Post"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl font-bold leading-none">×</button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Title */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Title *</label>
            <Input value={form.title} onChange={e => handleTitleChange(e.target.value)} placeholder="Why Pahrump is Nevada's Best-Kept Secret..." />
          </div>

          {/* Slug + Author */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">
                URL Slug <span className="font-normal normal-case text-gray-400">(auto-generated)</span>
              </label>
              <Input
                value={form.slug}
                onChange={e => set("slug", toSlug(e.target.value))}
                placeholder="why-pahrump-is-nevadas-best-kept-secret"
              />
              {form.slug && (
                <div className="text-xs text-gray-400 mt-1 truncate">/blog/<span className="text-[#1B3A6B] font-medium">{form.slug}</span></div>
              )}
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Author</label>
              <Input value={form.author} onChange={e => set("author", e.target.value)} placeholder="Kyla Davis" />
            </div>
          </div>

          {/* Category + Read Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Category</label>
              <Select value={form.category} onValueChange={v => set("category", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Read Time</label>
              <Input value={form.readTime} onChange={e => set("readTime", e.target.value)} placeholder="5 min" />
            </div>
          </div>

          {/* Excerpt */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Excerpt <span className="font-normal normal-case">(shown on homepage card)</span></label>
            <textarea
              value={form.excerpt}
              onChange={e => set("excerpt", e.target.value)}
              rows={2}
              placeholder="A short summary of the post..."
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
            />
          </div>

          {/* Body */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Body <span className="font-normal normal-case">(full article content, supports Markdown)</span></label>
              {(() => {
                const words = form.body.trim() ? form.body.trim().split(/\s+/).length : 0;
                const readMins = Math.max(1, Math.round(words / 200));
                const inRange = words >= 900 && words <= 950;
                const tooShort = words > 0 && words < 900;
                const tooLong = words > 950;
                return (
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    inRange ? "bg-green-100 text-green-700" :
                    tooShort ? "bg-amber-100 text-amber-700" :
                    tooLong ? "bg-red-100 text-red-700" :
                    "bg-slate-100 text-slate-500"
                  }`}>
                    {words.toLocaleString()} words &middot; {readMins} min read
                    {inRange && " ✓"}
                    {tooShort && ` (${900 - words} to go)`}
                    {tooLong && ` (${words - 950} over)`}
                  </span>
                );
              })()}
            </div>
            <textarea
              value={form.body}
              onChange={e => set("body", e.target.value)}
              rows={8}
              placeholder="Full article content..."
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none font-mono"
            />
          </div>

          {/* Image URL */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Cover Image URL</label>
            <Input value={form.imageUrl} onChange={e => set("imageUrl", e.target.value)} placeholder="https://cdn.example.com/photo.jpg" />
            {form.imageUrl && (
              <img src={form.imageUrl} alt="preview" className="mt-2 h-24 w-full object-cover rounded-lg border" />
            )}
          </div>

          {/* SEO Score Widget */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">
              SEO Keyword <span className="font-normal normal-case text-gray-400">(checks title, excerpt, body)</span>
            </label>
            <Input
              value={form.seoKeyword}
              onChange={e => set("seoKeyword", e.target.value)}
              placeholder="e.g. Pahrump new homes"
            />
            {form.seoKeyword.trim() && (() => {
              const kw = form.seoKeyword.trim().toLowerCase();
              const inTitle = form.title.toLowerCase().includes(kw);
              const inExcerpt = form.excerpt.toLowerCase().includes(kw);
              const inBody = form.body.toLowerCase().includes(kw);
              const score = [inTitle, inExcerpt, inBody].filter(Boolean).length;
              const color = score === 3 ? "text-green-700 bg-green-50 border-green-200" : score >= 2 ? "text-amber-700 bg-amber-50 border-amber-200" : "text-red-700 bg-red-50 border-red-200";
              const label = score === 3 ? "Strong" : score === 2 ? "Fair" : "Weak";
              return (
                <div className={`mt-2 flex items-center gap-3 text-xs font-medium border rounded-lg px-3 py-2 ${color}`}>
                  <span className="font-bold">{label} SEO ({score}/3)</span>
                  <span className={inTitle ? "text-green-600" : "text-gray-400"}>Title {inTitle ? "✓" : "✗"}</span>
                  <span className={inExcerpt ? "text-green-600" : "text-gray-400"}>Excerpt {inExcerpt ? "✓" : "✗"}</span>
                  <span className={inBody ? "text-green-600" : "text-gray-400"}>Body {inBody ? "✓" : "✗"}</span>
                </div>
              );
            })()}
          </div>

          {/* Scheduled Publish Date */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">
              Scheduled Publish Date <span className="font-normal normal-case text-gray-400">(leave blank to publish manually)</span>
            </label>
            <Input
              type="datetime-local"
              value={form.scheduledPublishAt}
              onChange={e => set("scheduledPublishAt", e.target.value)}
            />
            {form.scheduledPublishAt && (
              <div className="text-xs text-[#1B3A6B] mt-1">
                Will auto-publish on {new Date(form.scheduledPublishAt).toLocaleString()}
              </div>
            )}
          </div>

          {/* Sort Order + Featured */}
          <div className="grid grid-cols-2 gap-4 items-end">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Sort Order</label>
              <Input type="number" value={form.sortOrder} onChange={e => set("sortOrder", e.target.value)} placeholder="0" />
            </div>
            <div className="flex items-center gap-3 pb-1">
              <button
                type="button"
                onClick={() => set("featured", !form.featured)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${form.featured ? "bg-[#0f2044]" : "bg-gray-200"}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form.featured ? "translate-x-6" : "translate-x-1"}`} />
              </button>
              <span className="text-sm font-semibold text-[#0f2044]">Show on Homepage</span>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button
            onClick={() => onSave(form)}
            disabled={saving || !form.title}
            className="bg-[#0f2044] hover:bg-[#1a3366]"
          >
            {saving ? "Saving..." : "Save Post"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────

function DeleteModal({ title, onCancel, onConfirm, deleting }: {
  title: string;
  onCancel: () => void;
  onConfirm: () => void;
  deleting: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <h2 className="text-lg font-bold text-[#0f2044] mb-2">Delete Post?</h2>
        <p className="text-sm text-gray-500 mb-6">
          "<span className="font-medium text-gray-700">{title}</span>" will be permanently removed.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onCancel} disabled={deleting}>Cancel</Button>
          <Button onClick={onConfirm} disabled={deleting} className="bg-red-600 hover:bg-red-700 text-white">
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SCOPSBlog() {
  const adminMeQuery = trpc.adminAuth.me.useQuery();
  const adminUser = adminMeQuery.data;
  const loading = adminMeQuery.isLoading;

  const [showModal, setShowModal] = useState(false);
  const [editPost, setEditPost] = useState<{ id: number; form: BlogForm } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; title: string } | null>(null);

  // Auto-open the new post form when navigated here with ?new=1
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("new") === "1") {
      setShowModal(true);
      // Clean the query param from the URL without a page reload
      const clean = window.location.pathname;
      window.history.replaceState({}, "", clean);
    }
  }, []);
  const [previewPost, setPreviewPost] = useState<{
    title: string; author: string; category: string; body: string;
    imageUrl: string; excerpt: string; readTime: string;
  } | null>(null);

  const utils = trpc.useUtils();

  const { data: posts, isLoading } = trpc.blog.getAll.useQuery();

  const createMutation = trpc.blog.create.useMutation({
    onSuccess: () => {
      utils.blog.getAll.invalidate();
      utils.blog.getFeatured.invalidate();
      setShowModal(false);
      toast.success("Blog post created");
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.blog.update.useMutation({
    onSuccess: () => {
      utils.blog.getAll.invalidate();
      utils.blog.getFeatured.invalidate();
      setEditPost(null);
      toast.success("Post updated");
    },
    onError: (e) => toast.error(e.message),
  });

  const setStatusMutation = trpc.blog.setStatus.useMutation({
    onMutate: async ({ id, status }) => {
      await utils.blog.getAll.cancel();
      const prev = utils.blog.getAll.getData();
      utils.blog.getAll.setData(undefined, old =>
        old?.map(p => p.id === id ? { ...p, status } : p)
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) utils.blog.getAll.setData(undefined, ctx.prev);
      toast.error("Failed to update status");
    },
    onSettled: () => {
      utils.blog.getAll.invalidate();
      utils.blog.getFeatured.invalidate();
    },
    onSuccess: (_d, vars) => {
      toast.success(vars.status === "published" ? "Post published" : "Post moved to draft");
    },
  });

  const toggleMutation = trpc.blog.toggleFeatured.useMutation({
    onMutate: async ({ id, featured }) => {
      await utils.blog.getAll.cancel();
      const prev = utils.blog.getAll.getData();
      utils.blog.getAll.setData(undefined, old =>
        old?.map(p => p.id === id ? { ...p, featured } : p)
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) utils.blog.getAll.setData(undefined, ctx.prev);
      toast.error("Failed to update");
    },
    onSettled: () => {
      utils.blog.getAll.invalidate();
      utils.blog.getFeatured.invalidate();
    },
  });

  const deleteMutation = trpc.blog.delete.useMutation({
    onSuccess: () => {
      utils.blog.getAll.invalidate();
      utils.blog.getFeatured.invalidate();
      setDeleteTarget(null);
      toast.success("Post deleted");
    },
    onError: (e) => toast.error(e.message),
  });

  // Auth guard
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f8fb]">
        <div className="text-[#6b7a99] text-sm">Loading...</div>
      </div>
    );
  }
  if (!adminUser) {
    window.location.href = "/admin-login";
    return null;
  }

  const handleSaveNew = (form: BlogForm) => {
    createMutation.mutate({
      title: form.title,
      slug: form.slug || toSlug(form.title),
      author: form.author || undefined,
      category: form.category,
      excerpt: form.excerpt || undefined,
      body: form.body || undefined,
      readTime: form.readTime,
      imageUrl: form.imageUrl || undefined,
      featured: form.featured ? 1 : 0,
      sortOrder: parseInt(form.sortOrder) || 0,
      scheduledPublishAt: form.scheduledPublishAt ? new Date(form.scheduledPublishAt) : null,
      lastEditedBy: adminUser.name,
    });
  };

  const handleSaveEdit = (form: BlogForm) => {
    if (!editPost) return;
    updateMutation.mutate({
      id: editPost.id,
      title: form.title,
      slug: form.slug || toSlug(form.title),
      author: form.author || undefined,
      category: form.category,
      excerpt: form.excerpt || undefined,
      body: form.body || undefined,
      readTime: form.readTime,
      imageUrl: form.imageUrl || undefined,
      featured: form.featured ? 1 : 0,
      sortOrder: parseInt(form.sortOrder) || 0,
      scheduledPublishAt: form.scheduledPublishAt ? new Date(form.scheduledPublishAt) : null,
      lastEditedBy: adminUser.name,
    });
  };

  const totalPosts = posts?.length ?? 0;
  const publishedCount = posts?.filter(p => p.status === "published").length ?? 0;
  const draftCount = posts?.filter(p => p.status !== "published").length ?? 0;
  const featuredCount = posts?.filter(p => p.featured === 1).length ?? 0;

  // ── Mock landing page data ──
  const LANDING_PAGE_ROWS = [
    { name: "Zillow Organic", icon: "🏠", visitors: 772, leads: 42, convRate: "$211M" },
    { name: "Facebook Retargeting", icon: "📘", visitors: 593, leads: 25, convRate: "$175M" },
    { name: "Google Search – 1BR Pahrump", icon: "🔍", visitors: 470, leads: 15, convRate: "$890K" },
  ];
  const LANDING_PAGE_CARDS = [
    { name: "Zillow Organic", icon: "🏠", sub: "Leads · 2 tours" },
    { name: "Facebook Retargeting", icon: "📘", sub: "Leads · 3 tours" },
    { name: "Google Search – 1BR Pahrump", icon: "🔍", sub: "Leads · 8 tours" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #e8edf8 0%, #d8e4f4 30%, #ccd8f0 60%, #d4dcf0 100%)", fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif", display: "flex", flexDirection: "column" }}>
      <SCOPSNav adminUser={adminUser} currentPage="blog" />

      {/* ── KPI Row ── */}
      <div style={{ padding: "14px 20px", background: "rgba(255,255,255,0.55)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.50)", display: "flex", gap: 12, alignItems: "stretch", flexWrap: "wrap" }}>
        {[
          { icon: "✈️", label: "Total Posts", value: `${totalPosts} posts` },
          { icon: "⭐", label: "Featured", value: `${featuredCount}` },
          { icon: "👤", label: "Leads Generated", value: `${publishedCount * 8} leads` },
          { icon: "👁", label: "Traffic", value: `${(totalPosts * 452).toLocaleString()} views` },
        ].map(kpi => (
          <div key={kpi.label} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 18px", background: "rgba(255,255,255,0.60)", border: "1px solid rgba(255,255,255,0.80)", borderRadius: 12, flex: "1 1 160px", minWidth: 140 }}>
            <span style={{ fontSize: 20 }}>{kpi.icon}</span>
            <div>
              <div style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600, letterSpacing: 0.5 }}>{kpi.label}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#1a1a2e", lineHeight: 1.2 }}>{kpi.value}</div>
            </div>
          </div>
        ))}
        <button onClick={() => setShowModal(true)} style={{ marginLeft: "auto", padding: "8px 18px", borderRadius: 10, fontSize: 13, fontWeight: 700, background: "rgba(255,255,255,0.70)", border: "1px solid rgba(0,0,0,0.12)", color: "#1a1a2e", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>+ New Post</button>
      </div>

      {/* ── Main Body ── */}
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 300px", gap: 16, padding: 16, overflow: "auto" }}>

        {/* LEFT: Blog Posts Table + Landing Pages */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

          {/* Blog Posts Table */}
          <div style={{ background: "rgba(255,255,255,0.55)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.70)", borderRadius: 16, boxShadow: "0 4px 24px rgba(0,0,0,0.06)", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px 10px", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#1a1a2e" }}>Blog Posts</span>
              <input placeholder="Search content..." style={{ padding: "5px 12px", background: "rgba(255,255,255,0.80)", border: "1px solid rgba(0,0,0,0.10)", borderRadius: 20, fontSize: 11, color: "#1a1a2e", outline: "none", width: 160 }} />
            </div>
            {isLoading ? (
              <div style={{ padding: 32, textAlign: "center", color: "#9ca3af", fontSize: 13 }}>Loading posts...</div>
            ) : !posts?.length ? (
              <div style={{ padding: 32, textAlign: "center" }}>
                <p style={{ color: "#1a1a2e", fontWeight: 600, marginBottom: 6 }}>No blog posts yet</p>
                <p style={{ color: "#9ca3af", fontSize: 12, marginBottom: 16 }}>Add your first post to start populating the homepage blog section.</p>
                <button onClick={() => setShowModal(true)} style={{ padding: "8px 18px", borderRadius: 8, fontSize: 12, fontWeight: 700, background: "#0f2044", color: "white", border: "none", cursor: "pointer" }}>+ Add Post</button>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid rgba(0,0,0,0.06)", background: "rgba(0,0,0,0.02)" }}>
                      {["Title", "Status ↕", "Views ↕", "Leads", ""].map(h => (
                        <th key={h} style={{ textAlign: h === "" ? "right" : "left", padding: "8px 14px", fontSize: 10, fontWeight: 700, color: "#9ca3af", letterSpacing: 0.8, whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {posts.map((post, i) => (
                      <tr
                        key={post.id}
                        style={{ borderBottom: "1px solid rgba(0,0,0,0.04)", background: i % 2 === 0 ? "transparent" : "rgba(0,0,0,0.01)" }}
                      >
                        {/* Title */}
                        <td style={{ padding: "10px 14px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            {post.imageUrl ? (
                              <img src={post.imageUrl} alt={post.title} style={{ width: 48, height: 36, objectFit: "cover", borderRadius: 6, flexShrink: 0 }} />
                            ) : (
                              <div style={{ width: 48, height: 36, borderRadius: 6, background: "rgba(0,0,0,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5"><path d="M4 6h16M4 10h16M4 14h8"/></svg>
                              </div>
                            )}
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontWeight: 600, color: "#1a1a2e", fontSize: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 220 }}>{post.title}</div>
                              {post.featured === 1 && <span style={{ fontSize: 9, fontWeight: 700, color: "#2563eb", background: "rgba(37,99,235,0.10)", padding: "2px 6px", borderRadius: 4, marginTop: 2, display: "inline-block" }}>FEATURED</span>}
                            </div>
                          </div>
                        </td>
                        {/* Status */}
                        <td style={{ padding: "10px 14px" }}>
                          <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 20, background: post.status === "published" ? "rgba(34,197,94,0.15)" : "rgba(245,158,11,0.15)", color: post.status === "published" ? "#16a34a" : "#d97706" }}>
                            {post.status === "published" ? "Published" : "Draft"}
                          </span>
                        </td>
                        {/* Views (mock) */}
                        <td style={{ padding: "10px 14px", color: "#6b7280", fontSize: 12 }}>{(post.sortOrder ?? 0) * 120 + 320}</td>
                        {/* Leads (mock) */}
                        <td style={{ padding: "10px 14px", color: "#6b7280", fontSize: 12 }}>{Math.floor(((post.sortOrder ?? 0) * 3) + 4)}</td>
                        {/* Actions */}
                        <td style={{ padding: "10px 14px", textAlign: "right" }}>
                          <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
                            <button onClick={() => setPreviewPost({ title: post.title, author: (post as { author?: string }).author ?? "", category: post.category, body: post.body ?? "", imageUrl: post.imageUrl ?? "", excerpt: post.excerpt ?? "", readTime: post.readTime ?? "5 min" })} style={{ padding: "3px 8px", borderRadius: 6, fontSize: 10, fontWeight: 600, background: "rgba(0,0,0,0.06)", border: "none", cursor: "pointer", color: "#374151" }}>Preview</button>
                            <button onClick={() => setEditPost({ id: post.id, form: { title: post.title, slug: (post as { slug?: string }).slug ?? toSlug(post.title), author: (post as { author?: string }).author ?? "", category: (post.category as Category) ?? "Tips", excerpt: post.excerpt ?? "", body: post.body ?? "", readTime: post.readTime ?? "5 min", imageUrl: post.imageUrl ?? "", featured: post.featured === 1, sortOrder: String(post.sortOrder ?? 0), scheduledPublishAt: (post as { scheduledPublishAt?: Date }).scheduledPublishAt ? new Date((post as { scheduledPublishAt?: Date }).scheduledPublishAt!).toISOString().slice(0, 16) : "", seoKeyword: "" } })} style={{ padding: "3px 8px", borderRadius: 6, fontSize: 10, fontWeight: 600, background: "rgba(0,0,0,0.06)", border: "none", cursor: "pointer", color: "#374151" }}>Edit</button>
                            <button onClick={() => setStatusMutation.mutate({ id: post.id, status: post.status === "published" ? "draft" : "published" })} style={{ padding: "3px 8px", borderRadius: 6, fontSize: 10, fontWeight: 600, background: post.status === "published" ? "rgba(245,158,11,0.12)" : "rgba(34,197,94,0.12)", border: "none", cursor: "pointer", color: post.status === "published" ? "#d97706" : "#16a34a" }}>{post.status === "published" ? "Unpublish" : "Publish"}</button>
                            <button onClick={() => setDeleteTarget({ id: post.id, title: post.title })} style={{ padding: "3px 8px", borderRadius: 6, fontSize: 10, fontWeight: 600, background: "rgba(239,68,68,0.10)", border: "none", cursor: "pointer", color: "#dc2626" }}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Landing Pages Table */}
          <div style={{ background: "rgba(255,255,255,0.55)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.70)", borderRadius: 16, boxShadow: "0 4px 24px rgba(0,0,0,0.06)", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px 10px", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#1a1a2e" }}>Landing Pages</span>
              <span style={{ fontSize: 10, color: "#9ca3af", fontWeight: 600 }}>Past 60 Days</span>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(0,0,0,0.06)", background: "rgba(0,0,0,0.02)" }}>
                  {["TITLE", "VISITORS", "LEADS", "CONV. RATE"].map(h => (
                    <th key={h} style={{ textAlign: h === "TITLE" ? "left" : "right", padding: "7px 14px", fontSize: 9, fontWeight: 700, color: "#9ca3af", letterSpacing: 0.8 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {LANDING_PAGE_ROWS.map((row, i) => (
                  <tr key={row.name} style={{ borderBottom: i < LANDING_PAGE_ROWS.length - 1 ? "1px solid rgba(0,0,0,0.04)" : "none" }}>
                    <td style={{ padding: "9px 14px", display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 14 }}>{row.icon}</span>
                      <span style={{ fontWeight: 600, color: "#1a1a2e" }}>{row.name}</span>
                    </td>
                    <td style={{ padding: "9px 14px", textAlign: "right", color: "#374151" }}>{row.visitors}</td>
                    <td style={{ padding: "9px 14px", textAlign: "right", color: "#374151" }}>{row.leads}</td>
                    <td style={{ padding: "9px 14px", textAlign: "right", color: "#374151" }}>{row.convRate}</td>
                  </tr>
                ))}
                <tr style={{ borderTop: "1px solid rgba(0,0,0,0.08)", background: "rgba(0,0,0,0.02)" }}>
                  <td style={{ padding: "9px 14px", fontWeight: 700, color: "#1a1a2e", fontSize: 11 }}>TOTAL</td>
                  <td style={{ padding: "9px 14px", textAlign: "right", fontWeight: 700, color: "#1a1a2e" }}>1,835</td>
                  <td style={{ padding: "9px 14px", textAlign: "right", fontWeight: 700, color: "#1a1a2e" }}>82</td>
                  <td style={{ padding: "9px 14px", textAlign: "right", fontWeight: 700, color: "#1a1a2e" }}>$6.67M</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT: Landing Page Cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ background: "rgba(255,255,255,0.55)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.70)", borderRadius: 16, boxShadow: "0 4px 24px rgba(0,0,0,0.06)", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px 10px", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#1a1a2e" }}>Landing Pages</span>
              <span style={{ fontSize: 10, color: "#9ca3af", fontWeight: 600 }}>Past 60 Days</span>
            </div>
            <div style={{ padding: "8px 0" }}>
              {LANDING_PAGE_CARDS.map((card, i) => (
                <div key={card.name} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", borderBottom: i < LANDING_PAGE_CARDS.length - 1 ? "1px solid rgba(0,0,0,0.04)" : "none" }}>
                  <span style={{ fontSize: 18 }}>{card.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 12, color: "#1a1a2e", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{card.name}</div>
                    <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 1 }}>{card.sub}</div>
                  </div>
                  <button style={{ padding: "4px 10px", borderRadius: 6, fontSize: 10, fontWeight: 600, background: "rgba(0,0,0,0.06)", border: "none", cursor: "pointer", color: "#374151" }}>Edit</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Add Modal */}
      {showModal && (
        <BlogModal
          initial={EMPTY_FORM}
          onClose={() => setShowModal(false)}
          onSave={handleSaveNew}
          saving={createMutation.isPending}
        />
      )}

      {/* Edit Modal */}
      {editPost && (
        <BlogModal
          initial={editPost.form}
          onClose={() => setEditPost(null)}
          onSave={handleSaveEdit}
          saving={updateMutation.isPending}
        />
      )}

      {/* Delete Modal */}
      {deleteTarget && (
        <DeleteModal
          title={deleteTarget.title}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => deleteMutation.mutate({ id: deleteTarget.id })}
          deleting={deleteMutation.isPending}
        />
      )}

      {/* Preview Modal */}
      {previewPost && (
        <PreviewModal
          post={previewPost}
          onClose={() => setPreviewPost(null)}
        />
      )}
    </div>
  );
}
