import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { flowiseService } from "./services/flowise";
import { log } from "./vite";

export async function registerRoutes(app: Express): Promise<Server> {
  // Start Flowise service
  try {
    await flowiseService.start();
    log("Flowise service started successfully");
  } catch (error) {
    log(`Failed to start Flowise service: ${error}`);
  }

  // Get all filaments
  app.get("/api/filaments", async (req, res) => {
    try {
      const filaments = await storage.getFilaments();
      res.json(filaments);
    } catch (error) {
      log(`Error fetching filaments: ${error}`);
      res.status(500).json({ error: "Failed to fetch filaments" });
    }
  });

  // Search filaments
  app.post("/api/search", async (req, res) => {
    try {
      const { query } = req.body;
      
      if (!query) {
        return res.status(400).json({ error: "Query is required" });
      }

      // Search in database
      const filaments = await storage.searchFilaments(query);
      
      // Also query Flowise LLM for additional context
      let llmResponse = "";
      try {
        llmResponse = await flowiseService.queryLLM(query);
      } catch (error) {
        log(`LLM query failed: ${error}`);
      }

      res.json({
        filaments,
        llmResponse,
        query
      });
    } catch (error) {
      log(`Error in search: ${error}`);
      res.status(500).json({ error: "Search failed" });
    }
  });

  // Get service status
  app.get("/api/status", (req, res) => {
    const flowiseStatus = flowiseService.getStatus();
    res.json({
      flowise: flowiseStatus,
      database: { connected: true }, // Assuming database is connected if we reach this point
      server: { running: true }
    });
  });

  // Get all projects
  app.get("/api/projects", async (req, res) => {
    try {
      const projects = await storage.getProjects();
      res.json(projects);
    } catch (error) {
      log(`Error fetching projects: ${error}`);
      res.status(500).json({ error: "Failed to fetch projects" });
    }
  });

  // Get project filaments
  app.get("/api/projects/:id/filaments", async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const projectFilaments = await storage.getProjectFilaments(projectId);
      res.json(projectFilaments);
    } catch (error) {
      log(`Error fetching project filaments: ${error}`);
      res.status(500).json({ error: "Failed to fetch project filaments" });
    }
  });

  const httpServer = createServer(app);

  // Cleanup on exit
  process.on("SIGINT", async () => {
    log("Shutting down...");
    await flowiseService.stop();
    process.exit(0);
  });

  return httpServer;
}
