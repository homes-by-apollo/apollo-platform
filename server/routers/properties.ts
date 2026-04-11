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
import { storagePut } from "../storage";

const propertyTypeEnum = z.enum(["HOME", "LOT"]);
const tagEnum = z.enum(["Available", "Coming Soon", "Sold", "Under Contract"]);

const propertyInput = z.object({
  propertyType: propertyTypeEnum.default("HOME"),
  tag: tagEnum.default("Available"),
  address: z.string().min(1),
  city: z.string().default("Pahrump"),
  state: z.string().default("NV"),
  zip: z.string().optional(),
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

  // Admin: upload a property image to S3 and return the CDN URL
  uploadImage: adminOnly
    .input(
      z.object({
        fileName: z.string(),
        mimeType: z.string(),
        dataBase64: z.string(), // base64-encoded file bytes
      })
    )
    .mutation(async ({ input }) => {
      const bytes = Buffer.from(input.dataBase64, "base64");
      const ext = input.fileName.split(".").pop() ?? "jpg";
      const randomSuffix = Math.random().toString(36).slice(2, 8);
      const key = `properties/images/${Date.now()}-${randomSuffix}.${ext}`;
      const { url } = await storagePut(key, bytes, input.mimeType);
      return { url };
    }),

  // Admin: bulk update multiple properties at once
  bulkUpdate: adminOnly
    .input(z.object({
      ids: z.array(z.number()).min(1),
      data: z.object({
        tag: tagEnum.optional(),
        featured: z.number().min(0).max(1).optional(),
        propertyType: propertyTypeEnum.optional(),
      }),
    }))
    .mutation(async ({ input }) => {
      let updated = 0;
      for (const id of input.ids) {
        await updateProperty(id, input.data);
        updated++;
      }
      return { updated };
    }),

  // Admin: bulk delete multiple properties (super_admin only)
  bulkDelete: superAdminProcedure
    .input(z.object({ ids: z.array(z.number()).min(1) }))
    .mutation(async ({ input }) => {
      let deleted = 0;
      for (const id of input.ids) {
        await deleteProperty(id);
        deleted++;
      }
      return { deleted };
    }),

  // Geocode all properties that don't have lat/lng yet
  geocodeAll: adminOnly.mutation(async () => {
    const { makeRequest } = await import("../_core/map");
    const all = await getAllProperties();
    const ungeocoded = all.filter((p) => p.lat == null || p.lng == null);
    let succeeded = 0;
    let failed = 0;
    for (const prop of ungeocoded) {
      try {
        const addressStr = [prop.address, prop.city, prop.state].filter(Boolean).join(", ");
        const result = await makeRequest<any>("/maps/api/geocode/json", { address: addressStr });
        if (result.status === "OK" && result.results?.length > 0) {
          const loc = result.results[0].geometry.location;
          await updateProperty(prop.id, { lat: loc.lat, lng: loc.lng });
          succeeded++;
        } else {
          failed++;
        }
      } catch {
        failed++;
      }
    }
    return { total: ungeocoded.length, succeeded, failed };
  }),
});
