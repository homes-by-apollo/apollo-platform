import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

const CATEGORIES = ["Tips", "Construction", "Investment", "Finance", "Community", "News"] as const;
type Category = typeof CATEGORIES[number];

interface BlogForm {
  title: string;
  category: Category;
  excerpt: string;
  body: string;
  readTime: string;
  imageUrl: string;
  featured: boolean;
  sortOrder: string;
}

const EMPTY_FORM: BlogForm = {
  title: "",
  category: "Tips",
  excerpt: "",
  body: "",
  readTime: "5 min",
  imageUrl: "",
  featured: true,
  sortOrder: "0",
};

const CAT_COLORS: Record<string, string> = {
  Tips: "bg-blue-100 text-blue-700 border-blue-200",
  Construction: "bg-amber-100 text-amber-700 border-amber-200",
  Investment: "bg-green-100 text-green-700 border-green-200",
  Finance: "bg-purple-100 text-purple-700 border-purple-200",
  Community: "bg-pink-100 text-pink-700 border-pink-200",
  News: "bg-gray-100 text-gray-600 border-gray-200",
};

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
            <Input value={form.title} onChange={e => set("title", e.target.value)} placeholder="Why Pahrump is Nevada's Best-Kept Secret…" />
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
              placeholder="A short summary of the post…"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
            />
          </div>

          {/* Body */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Body <span className="font-normal normal-case">(full article content)</span></label>
            <textarea
              value={form.body}
              onChange={e => set("body", e.target.value)}
              rows={6}
              placeholder="Full article content…"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
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
            {saving ? "Saving…" : "Save Post"}
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
            {deleting ? "Deleting…" : "Delete"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CRMBlog() {
  const adminMeQuery = trpc.adminAuth.me.useQuery();
  const adminUser = adminMeQuery.data;
  const loading = adminMeQuery.isLoading;
  const logoutMutation = trpc.adminAuth.logout.useMutation({
    onSuccess: () => { window.location.href = "/admin-login"; },
  });
  const [showModal, setShowModal] = useState(false);
  const [editPost, setEditPost] = useState<{ id: number; form: BlogForm } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; title: string } | null>(null);

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
        <div className="text-[#6b7a99] text-sm">Loading…</div>
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
      category: form.category,
      excerpt: form.excerpt || undefined,
      body: form.body || undefined,
      readTime: form.readTime,
      imageUrl: form.imageUrl || undefined,
      featured: form.featured ? 1 : 0,
      sortOrder: parseInt(form.sortOrder) || 0,
    });
  };

  const handleSaveEdit = (form: BlogForm) => {
    if (!editPost) return;
    updateMutation.mutate({
      id: editPost.id,
      title: form.title,
      category: form.category,
      excerpt: form.excerpt || undefined,
      body: form.body || undefined,
      readTime: form.readTime,
      imageUrl: form.imageUrl || undefined,
      featured: form.featured ? 1 : 0,
      sortOrder: parseInt(form.sortOrder) || 0,
    });
  };

  const totalPosts = posts?.length ?? 0;
  const featuredCount = posts?.filter(p => p.featured === 1).length ?? 0;
  const categories = Array.from(new Set(posts?.map(p => p.category) ?? []));

  return (
    <div className="min-h-screen bg-[#f7f8fb]">
      {/* Header */}
      <div className="bg-white border-b border-[#dde3ef] sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/crm" className="text-[#6b7a99] hover:text-[#0f2044] text-sm font-medium transition-colors">
              ← Dashboard
            </a>
            <span className="text-[#dde3ef]">|</span>
            <a href="/crm/properties" className="text-[#6b7a99] hover:text-[#0f2044] text-sm font-medium transition-colors">
              Properties
            </a>
            <span className="text-[#dde3ef]">|</span>
            <span className="text-[#0f2044] text-sm font-semibold">Blog Posts</span>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setShowModal(true)}
              className="bg-[#0f2044] hover:bg-[#1a3366] text-white"
            >
              + Add Post
            </Button>
            <button
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
              className="text-xs text-[#6b7a99] hover:text-[#0f2044] border border-[#dde3ef] hover:border-[#0f2044] rounded px-2 py-1 transition-colors"
            >
              {logoutMutation.isPending ? "…" : "Sign Out"}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Page title */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-[#0f2044] tracking-tight">Blog Posts</h1>
          <p className="text-[#6b7a99] mt-1 text-sm">Manage homepage blog cards and article content.</p>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Posts", value: totalPosts },
            { label: "Featured on Homepage", value: featuredCount },
            { label: "Categories", value: categories.length },
            { label: "Hidden Posts", value: totalPosts - featuredCount },
          ].map(({ label, value }) => (
            <Card key={label} className="border-[#dde3ef]">
              <CardContent className="pt-5 pb-4">
                <div className="text-3xl font-extrabold text-[#0f2044]">{value}</div>
                <div className="text-xs text-[#6b7a99] mt-1 font-medium">{label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Table */}
        <Card className="border-[#dde3ef]">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold text-[#0f2044]">All Posts</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="py-16 text-center text-[#6b7a99] text-sm">Loading posts…</div>
            ) : !posts?.length ? (
              <div className="py-16 text-center">
                <p className="text-[#0f2044] font-semibold mb-1">No blog posts yet</p>
                <p className="text-[#6b7a99] text-sm mb-4">Add your first post to start populating the homepage blog section.</p>
                <Button onClick={() => setShowModal(true)} className="bg-[#0f2044] hover:bg-[#1a3366]">
                  + Add Post
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#dde3ef] bg-[#f7f8fb]">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-[#6b7a99] uppercase tracking-wide">Post</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-[#6b7a99] uppercase tracking-wide">Category</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-[#6b7a99] uppercase tracking-wide">Read Time</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-[#6b7a99] uppercase tracking-wide">Featured</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-[#6b7a99] uppercase tracking-wide">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {posts.map((post, i) => (
                      <tr
                        key={post.id}
                        className={`border-b border-[#dde3ef] hover:bg-[#f7f8fb] transition-colors ${i % 2 === 0 ? "" : "bg-[#fafbfc]"}`}
                      >
                        {/* Post info */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            {post.imageUrl ? (
                              <img
                                src={post.imageUrl}
                                alt={post.title}
                                className="w-14 h-10 object-cover rounded-lg border border-[#dde3ef] flex-shrink-0"
                              />
                            ) : (
                              <div className="w-14 h-10 rounded-lg bg-[#eef1f8] flex items-center justify-center flex-shrink-0">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7a99" strokeWidth="1.5"><path d="M4 6h16M4 10h16M4 14h8"/></svg>
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="font-semibold text-[#0f2044] truncate max-w-xs" title={post.title}>{post.title}</div>
                              {post.excerpt && (
                                <div className="text-xs text-[#6b7a99] truncate max-w-xs mt-0.5">{post.excerpt}</div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="px-4 py-4">
                          <Badge className={`text-xs border ${CAT_COLORS[post.category] ?? "bg-gray-100 text-gray-600 border-gray-200"}`} variant="outline">
                            {post.category}
                          </Badge>
                        </td>

                        {/* Read time */}
                        <td className="px-4 py-4 text-[#6b7a99]">{post.readTime}</td>

                        {/* Featured toggle */}
                        <td className="px-4 py-4 text-center">
                          <button
                            onClick={() => toggleMutation.mutate({ id: post.id, featured: post.featured === 1 ? 0 : 1 })}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${post.featured === 1 ? "bg-[#0f2044]" : "bg-gray-200"}`}
                            title={post.featured === 1 ? "Remove from homepage" : "Show on homepage"}
                          >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${post.featured === 1 ? "translate-x-6" : "translate-x-1"}`} />
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs h-8 border-[#dde3ef] text-[#0f2044] hover:bg-[#eef1f8]"
                              onClick={() => setEditPost({
                                id: post.id,
                                form: {
                                  title: post.title,
                                  category: (post.category as Category) ?? "Tips",
                                  excerpt: post.excerpt ?? "",
                                  body: post.body ?? "",
                                  readTime: post.readTime ?? "5 min",
                                  imageUrl: post.imageUrl ?? "",
                                  featured: post.featured === 1,
                                  sortOrder: String(post.sortOrder ?? 0),
                                },
                              })}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs h-8 border-red-200 text-red-600 hover:bg-red-50"
                              onClick={() => setDeleteTarget({ id: post.id, title: post.title })}
                            >
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
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
    </div>
  );
}
