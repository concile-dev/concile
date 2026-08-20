import { defineSchema, defineTable, v } from "@concile/values";

export default defineSchema({
  messages: defineTable({ body: v.string() }),
});
