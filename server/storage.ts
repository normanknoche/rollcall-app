import dotenv from "dotenv";
dotenv.config();
import pkg from 'pg';
const { Pool } = pkg;import { drizzle } from "drizzle-orm/neon-http";
import { filaments, projects, project_filaments, type Filament, type Project, type ProjectFilament, type InsertFilament, type InsertProject, type InsertProjectFilament } from "@shared/schema";
import { eq, like, or, ilike } from "drizzle-orm";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

export interface IStorage {
  // Filament operations
  getFilaments(): Promise<Filament[]>;
  getFilament(id: number): Promise<Filament | undefined>;
  createFilament(filament: InsertFilament): Promise<Filament>;
  searchFilaments(query: string): Promise<Filament[]>;
  
  // Project operations
  getProjects(): Promise<Project[]>;
  getProject(id: number): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  
  // Project filament operations
  getProjectFilaments(projectId: number): Promise<ProjectFilament[]>;
  createProjectFilament(projectFilament: InsertProjectFilament): Promise<ProjectFilament>;
}

export class DatabaseStorage implements IStorage {
  async getFilaments(): Promise<Filament[]> {
    return await db.select().from(filaments);
  }

  async getFilament(id: number): Promise<Filament | undefined> {
    const result = await db.select().from(filaments).where(eq(filaments.id, id));
    return result[0];
  }

  async createFilament(filament: InsertFilament): Promise<Filament> {
    const result = await db.insert(filaments).values(filament).returning();
    return result[0];
  }

  async searchFilaments(query: string): Promise<Filament[]> {
    const searchTerm = `%${query}%`;
    return await db.select().from(filaments).where(
      or(
        ilike(filaments.name, searchTerm),
        ilike(filaments.material, searchTerm),
        ilike(filaments.color, searchTerm),
        ilike(filaments.brand, searchTerm),
        ilike(filaments.description, searchTerm),
        ilike(filaments.properties, searchTerm)
      )
    );
  }

  async getProjects(): Promise<Project[]> {
    return await db.select().from(projects);
  }

  async getProject(id: number): Promise<Project | undefined> {
    const result = await db.select().from(projects).where(eq(projects.id, id));
    return result[0];
  }

  async createProject(project: InsertProject): Promise<Project> {
    const result = await db.insert(projects).values(project).returning();
    return result[0];
  }

  async getProjectFilaments(projectId: number): Promise<ProjectFilament[]> {
    return await db.select().from(project_filaments).where(eq(project_filaments.project_id, projectId));
  }

  async createProjectFilament(projectFilament: InsertProjectFilament): Promise<ProjectFilament> {
    const result = await db.insert(project_filaments).values(projectFilament).returning();
    return result[0];
  }
}

export const storage = new DatabaseStorage();
