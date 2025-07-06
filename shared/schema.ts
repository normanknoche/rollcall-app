import { pgTable, text, serial, integer, decimal, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const filaments = pgTable("filaments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  material: text("material").notNull(),
  color: text("color").notNull(),
  diameter: decimal("diameter", { precision: 4, scale: 2 }).notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  brand: text("brand"),
  description: text("description"),
  temperature_range: text("temperature_range"),
  properties: text("properties"),
  created_at: timestamp("created_at").defaultNow(),
});

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  created_at: timestamp("created_at").defaultNow(),
});

export const project_filaments = pgTable("project_filaments", {
  id: serial("id").primaryKey(),
  project_id: integer("project_id").notNull(),
  filament_id: integer("filament_id").notNull(),
  quantity: integer("quantity").notNull().default(1),
  created_at: timestamp("created_at").defaultNow(),
});

export const insertFilamentSchema = createInsertSchema(filaments).omit({
  id: true,
  created_at: true,
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  created_at: true,
});

export const insertProjectFilamentSchema = createInsertSchema(project_filaments).omit({
  id: true,
  created_at: true,
});

export type InsertFilament = z.infer<typeof insertFilamentSchema>;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type InsertProjectFilament = z.infer<typeof insertProjectFilamentSchema>;

export type Filament = typeof filaments.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type ProjectFilament = typeof project_filaments.$inferSelect;
