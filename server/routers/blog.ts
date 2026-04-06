import { z } from "zod";
import { adminProcedure, publicProcedure, router } from "../_core/trpc";
import {
  createBlogPost,
  deleteBlogPost,
  getAllBlogPosts,
  getAllBlogPostsAdmin,
  getBlogPostById,
  getBlogPostBySlug,
  getRelatedBlogPosts,
  getFeaturedBlogPosts,
  updateBlogPost,
} from "../db";

/** Generate a URL-safe slug from a title */
function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 100);
}

export const blogRouter = router({
  // Public: homepage preview cards (published only)
  getFeatured: publicProcedure.query(async () => {
    return getFeaturedBlogPosts();
  }),

  // Public: all published posts for /blog page
  getPublished: publicProcedure.query(async () => {
    return getAllBlogPosts();
  }),

  // Public: single post by slug
  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      return getBlogPostBySlug(input.slug);
    }),

  // Public: related posts by category (excluding current post)
  getRelated: publicProcedure
    .input(z.object({ category: z.string(), excludeId: z.number() }))
    .query(async ({ input }) => {
      return getRelatedBlogPosts(input.category, input.excludeId);
    }),

  // Admin: full list including drafts
  getAll: adminProcedure.query(async () => {
    return getAllBlogPostsAdmin();
  }),

  getById: adminProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return getBlogPostById(input.id);
    }),

  create: adminProcedure
    .input(
      z.object({
        title: z.string().min(1),
        slug: z.string().optional(),
        author: z.string().optional(),
        category: z.string().default("Tips"),
        excerpt: z.string().optional(),
        body: z.string().optional(),
        readTime: z.string().default("5 min"),
        imageUrl: z.string().optional(),
        featured: z.number().min(0).max(1).default(1),
        sortOrder: z.number().default(0),
        status: z.enum(["draft", "published"]).default("draft"),
        publishedAt: z.date().optional(),
        scheduledPublishAt: z.date().nullable().optional(),
        lastEditedBy: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const slug = input.slug?.trim() || slugify(input.title);
      const id = await createBlogPost({
        ...input,
        slug,
        author: input.author || "Apollo Home Builders",
        publishedAt: input.publishedAt ?? new Date(),
        lastEditedBy: input.lastEditedBy ?? ctx.user?.name ?? null,
        lastEditedAt: new Date(),
      });
      return { id, slug };
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().min(1).optional(),
        slug: z.string().optional(),
        author: z.string().optional(),
        category: z.string().optional(),
        excerpt: z.string().optional(),
        body: z.string().optional(),
        readTime: z.string().optional(),
        imageUrl: z.string().optional(),
        featured: z.number().min(0).max(1).optional(),
        sortOrder: z.number().optional(),
        status: z.enum(["draft", "published"]).optional(),
        publishedAt: z.date().optional(),
        scheduledPublishAt: z.date().nullable().optional(),
        lastEditedBy: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      // Auto-generate slug from title if title changed but no slug provided
      if (data.title && !data.slug) {
        data.slug = slugify(data.title);
      }
      // Always stamp last-edited audit fields
      await updateBlogPost(id, {
        ...data,
        lastEditedBy: data.lastEditedBy ?? ctx.user?.name ?? null,
        lastEditedAt: new Date(),
      });
      return { success: true };
    }),

  // Publish or unpublish a post
  setStatus: adminProcedure
    .input(z.object({ id: z.number(), status: z.enum(["draft", "published"]) }))
    .mutation(async ({ input }) => {
      await updateBlogPost(input.id, {
        status: input.status,
        publishedAt: input.status === "published" ? new Date() : undefined,
      });
      return { success: true };
    }),

  toggleFeatured: adminProcedure
    .input(z.object({ id: z.number(), featured: z.number().min(0).max(1) }))
    .mutation(async ({ input }) => {
      await updateBlogPost(input.id, { featured: input.featured });
      return { success: true };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteBlogPost(input.id);
      return { success: true };
    }),
});
