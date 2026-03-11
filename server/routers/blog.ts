import { z } from "zod";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "../_core/trpc";
import {
  createBlogPost,
  deleteBlogPost,
  getAllBlogPosts,
  getBlogPostById,
  getFeaturedBlogPosts,
  updateBlogPost,
} from "../db";

export const blogRouter = router({
  // Public: homepage preview cards
  getFeatured: publicProcedure.query(async () => {
    return getFeaturedBlogPosts();
  }),

  // Admin: full list for CRM table
  getAll: adminProcedure.query(async () => {
    return getAllBlogPosts();
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
        publishedAt: z.date().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updateBlogPost(id, data);
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
