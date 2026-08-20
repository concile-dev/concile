import { defineSchema, defineTable, v } from "@concile/values";

export default defineSchema({
  notes: defineTable({ userId: v.string(), body: v.string() }).index("byUser", ["userId"]),
});
