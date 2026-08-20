import { defineSchema, defineTable, v } from "@concile/values";
export default defineSchema({ notes: defineTable({ text: v.string() }) });
