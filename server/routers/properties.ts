import { z } from "zod";
import {
  createProperty,
  deleteProperty,
  getAllProperties,
  getFeaturedProperties,
  getPropertyById,
  updateProperty,
} from "../db";
import { protectedProcedure, publicProcedure, router, superAdminProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";

const propertyTypeEnum = z.enum(["HOME", "LOT"]);
const tagEnum = z.enum(["Available", "Coming Soon", "Sold", "Under Contract"]);

const propertyInput = z.object({
  propertyType: propertyTypeEnum.default("HOME"),
  tag: tagEnum.default("Available"),
  address: z.string().min(1),
  city: z.string().default("Pahrump"),
  state: z.string().default("NV"),
  price: z.string().min(1),
  priceValue: z.number().optional(),
  beds: z.number().optional(),
  baths: z.number().optional(),
  sqft: z.string().optional(),
  lotSize: z.string().optional(),
  utilities: z.string().optional(),
  imageUrl: z.string().optional(),
  imageUrls: z.string().optional(), // JSON array string
  featured: z.number().min(0).max(1).default(0),
  sortOrder: z.number().default(0),
  description: z.string().optional(),
});

const adminOnly = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

export const propertiesRouter = router({
  // Public: homepage carousel
  getFeatured: publicProcedure.query(async () => {
    return getFeaturedProperties();
  }),

  // Public: all properties with optional filters
  getAll: publicProcedure
    .input(
      z.object({
        propertyType: propertyTypeEnum.optional(),
        tag: tagEnum.optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      return getAllProperties(input);
    }),

  // Public: single property detail
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const prop = await getPropertyById(input.id);
      if (!prop) throw new TRPCError({ code: "NOT_FOUND", message: "Property not found" });
      return prop;
    }),

  // Admin: create
  create: adminOnly.input(propertyInput).mutation(async ({ input }) => {
    const id = await createProperty(input);
    return { id };
  }),

  // Admin: update
  update: adminOnly
    .input(z.object({ id: z.number(), data: propertyInput.partial() }))
    .mutation(async ({ input }) => {
      await updateProperty(input.id, input.data);
      return { success: true };
    }),

  // Admin: delete — super_admin only
  delete: superAdminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteProperty(input.id);
      return { success: true };
    }),

  // Cache geocoded coordinates on first lookup
  saveCoordinates: adminOnly
    .input(z.object({ id: z.number(), lat: z.number(), lng: z.number() }))
    .mutation(async ({ input }) => {
      await updateProperty(input.id, { lat: input.lat, lng: input.lng });
      return { success: true };
    }),
});
