import type { Express, Request, Response } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertVehicleSchema, insertApiKeySchema } from "./schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  const router = express.Router();

  // Authentication middleware
  const authenticate = async (req: any, res: Response, next: Function) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "Token de acesso requerido" });
      return;
    }

    const token = authHeader.substring(7);
    const apiKey = await storage.getApiKeyByKey(token);

    if (!apiKey || !apiKey.active) {
      res.status(401).json({ error: "Token inválido" });
      return;
    }

    await storage.updateApiKeyLastUsed(token);
    const user = await storage.getUser(apiKey.userId);
    req.user = user;
    next();
  };

  // Auth routes
  router.post("/auth/login", async (req: Request, res: Response) => {
    try {
      const { matricula, password } = req.body;
      const user = await storage.getUserByMatricula(matricula);

      if (!user || user.password !== password) {
        res.status(401).json({ error: "Credenciais inválidas" });
        return;
      }

      res.json({
        user: {
          id: user.id,
          matricula: user.matricula,
          name: user.name,
          type: user.type,
        },
      });
    } catch (error) {
      res.status(400).json({ error: "Dados inválidos" });
    }
  });

  router.post("/auth/logout", (_req: Request, res: Response) => {
    res.json({ success: true });
  });

  // Vehicles routes
  router.get("/vehicles", async (_req: Request, res: Response) => {
    try {
      const vehicles = await storage.getVehicles();
      res.json(vehicles);
    } catch {
      res.status(500).json({ error: "Erro ao buscar veículos" });
    }
  });

  router.get("/vehicles/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const vehicle = await storage.getVehicle(id);
      if (!vehicle) {
        res.status(404).json({ error: "Veículo não encontrado" });
        return;
      }
      res.json(vehicle);
    } catch {
      res.status(500).json({ error: "Erro ao buscar veículo" });
    }
  });

  router.post("/vehicles", async (req: Request, res: Response) => {
    try {
      const vehicleData = insertVehicleSchema.parse(req.body);
      const vehicle = await storage.createVehicle(vehicleData);
      res.json(vehicle);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Dados inválidos", details: error.errors });
        return;
      }
      res.status(500).json({ error: "Erro ao criar veículo" });
    }
  });

  router.put("/vehicles/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = insertVehicleSchema.partial().parse(req.body);
      const vehicle = await storage.updateVehicle(id, updateData);

      if (!vehicle) {
        res.status(404).json({ error: "Veículo não encontrado" });
        return;
      }

      res.json(vehicle);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Dados inválidos", details: error.errors });
        return;
      }
      res.status(500).json({ error: "Erro ao atualizar veículo" });
    }
  });

  router.delete("/vehicles/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteVehicle(id);

      if (!deleted) {
        res.status(404).json({ error: "Veículo não encontrado" });
        return;
      }

      res.json({ success: true });
    } catch {
      res.status(500).json({ error: "Erro ao excluir veículo" });
    }
  });

  // API Keys
  router.get("/api-keys", authenticate, async (req: any, res: Response) => {
    try {
      const apiKeys = await storage.getApiKeys(req.user.id);
      const safeKeys = apiKeys.map((key) => ({
        ...key,
        key: key.key.substring(0, 12) + "..." + key.key.substring(key.key.length - 4),
      }));
      res.json(safeKeys);
    } catch {
      res.status(500).json({ error: "Erro ao buscar chaves de API" });
    }
  });

  router.post("/api-keys", authenticate, async (req: any, res: Response) => {
    try {
      const keyData = insertApiKeySchema.parse(req.body);
      const apiKey = await storage.createApiKey({ ...keyData, userId: req.user.id });
      res.json(apiKey);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Dados inválidos", details: error.errors });
        return;
      }
      res.status(500).json({ error: "Erro ao criar chave de API" });
    }
  });

  router.delete("/api-keys/:id", authenticate, async (req: any, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteApiKey(id);
      if (!deleted) {
        res.status(404).json({ error: "Chave de API não encontrada" });
        return;
      }
      res.json({ success: true });
    } catch {
      res.status(500).json({ error: "Erro ao excluir chave de API" });
    }
  });

  // Metrics route
  router.get("/metrics", async (_req: Request, res: Response) => {
    try {
      const metrics = await storage.getMetrics();
      res.json(metrics);
    } catch {
      res.status(500).json({ error: "Erro ao buscar métricas" });
    }
  });

  app.use("/api", router);
  const httpServer = createServer(app);
  return httpServer;
}
