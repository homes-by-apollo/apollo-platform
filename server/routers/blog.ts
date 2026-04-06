import { z } from "zod";
import { adminProcedure, publicProcedure, router } from "../_core/trpc";
import {
  createBlogPost,
  deleteBlogPost,
  getAllBlogPosts,
  getAllBlogPostsAdmin,
  getBlogPostById,
  getFeaturedBlogPosts,
  updateBlogPost,
} from "../db";

export const blogRouter = router({
  // Public: homepage preview cards (published only)
  getFeatured: publicProcedure.query(async () => {
    return getFeaturedBlogPosts();
  }),

  // Public: all published posts for /blog page
  getPublished: publicProcedure.query(async () => {
    return getAllBlogPosts();
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
        category: z.string().default("Tips"),
        excerpt: z.string().optional(),
        body: z.string().optional(),
        readTime: z.string().default("5 min"),
        imageUrl: z.string().optional(),
        featured: z.number().min(0).max(1).default(1),
        sortOrder: z.number().default(0),
        status: z.enum(["draft", "published"]).default("draft"),
        publishedAt: z.date().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const id = await createBlogPost({
        ...input,
        publishedAt: input.publishedAt ?? new Date(),
      });
      return { id };
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().min(1).optional(),
        category: z.string().optional(),
        excerpt: z.string().optional(),
        body: z.string().optional(),
        readTime: z.string().optional(),
        imageUrl: z.string().optional(),
        featured: z.number().min(0).max(1).optional(),
        sortOrder: z.number().optional(),
        status: z.enum(["draft", "published"]).optional(),
        publishedAt: z.date().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updateBlogPost(id, data);
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
