import { spawn, ChildProcess } from "child_process";
import { log } from "../vite";

export class FlowiseService {
  private flowiseProcess: ChildProcess | null = null;
  private isRunning = false;

  async start(): Promise<void> {
    if (this.isRunning) {
      log("Flowise is already running");
      return;
    }

    try {
      log("Starting Flowise...");
      
      // Start Flowise using npx
      this.flowiseProcess = spawn("npx", ["flowise", "start"], {
        stdio: ["pipe", "pipe", "pipe"],
        env: {
          ...process.env,
          PORT: "3000", // Flowise will run on port 3000
        },
      });

      this.flowiseProcess.stdout?.on("data", (data) => {
        const output = data.toString();
        if (output.includes("Server listening on")) {
          this.isRunning = true;
          log("Flowise started successfully on port 3000");
        }
        log(`Flowise: ${output.trim()}`, "flowise");
      });

      this.flowiseProcess.stderr?.on("data", (data) => {
        log(`Flowise Error: ${data.toString().trim()}`, "flowise");
      });

      this.flowiseProcess.on("error", (error) => {
        log(`Failed to start Flowise: ${error.message}`, "flowise");
        this.isRunning = false;
      });

      this.flowiseProcess.on("exit", (code) => {
        log(`Flowise exited with code ${code}`, "flowise");
        this.isRunning = false;
      });

      // Wait for Flowise to start
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Flowise startup timeout"));
        }, 30000);

        const checkStartup = () => {
          if (this.isRunning) {
            clearTimeout(timeout);
            resolve();
          } else {
            setTimeout(checkStartup, 1000);
          }
        };

        checkStartup();
      });

    } catch (error) {
      log(`Error starting Flowise: ${error}`, "flowise");
      throw error;
    }
  }

  async queryLLM(query: string): Promise<string> {
    try {
      // This would typically make an API call to Flowise
      // For now, we'll simulate the response
      log(`Querying Flowise LLM: ${query}`, "flowise");
      
      // In a real implementation, you would make an HTTP request to Flowise API
      // const response = await fetch('http://localhost:3000/api/v1/prediction/YOUR_CHATFLOW_ID', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ question: query })
      // });
      
      // For now, return a placeholder response
      return `Processed query: "${query}" through Flowise LLM`;
    } catch (error) {
      log(`Error querying Flowise LLM: ${error}`, "flowise");
      throw error;
    }
  }

  getStatus(): { running: boolean } {
    return { running: this.isRunning };
  }

  async stop(): Promise<void> {
    if (this.flowiseProcess) {
      this.flowiseProcess.kill();
      this.flowiseProcess = null;
      this.isRunning = false;
      log("Flowise stopped");
    }
  }
}

export const flowiseService = new FlowiseService();
