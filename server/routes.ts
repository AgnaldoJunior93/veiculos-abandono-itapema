import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertVehicleSchema, insertCampaignSchema, insertApiKeySchema, loginSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Authentication middleware
  const authenticate = async (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: "Token de acesso requerido" });
    }
    
    const token = authHeader.substring(7);
    const apiKey = await storage.getApiKeyByKey(token);
    
    if (!apiKey || !apiKey.active) {
      return res.status(401).json({ error: "Token inválido" });
    }
    
    await storage.updateApiKeyLastUsed(token);
    const user = await storage.getUser(apiKey.userId);
    req.user = user;
    next();
  };

  // Auth routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { matricula, password } = loginSchema.parse(req.body);
      console.log("Login attempt:", { matricula, password });
      
      const user = await storage.getUserByMatricula(matricula);
      console.log("Found user:", user);
      
      if (!user) {
        console.log("Password comparison:", { userPassword: undefined, providedPassword: password });
        return res.status(401).json({ error: "Credenciais inválidas" });
      }
      
      console.log("Password comparison:", { userPassword: user.password, providedPassword: password });
      
      if (user.password !== password) {
        return res.status(401).json({ error: "Credenciais inválidas" });
      }
      
      res.json({ 
        user: { 
          id: user.id, 
          matricula: user.matricula, 
          name: user.name, 
          type: user.type 
        } 
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(400).json({ error: "Dados inválidos" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    res.json({ success: true });
  });

  // Vehicles routes
  app.get("/api/vehicles", async (req, res) => {
    try {
      const vehicles = await storage.getVehicles();
      res.json(vehicles);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      res.status(500).json({ error: "Erro ao buscar veículos" });
    }
  });

  app.get("/api/vehicles/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const vehicle = await storage.getVehicle(id);
      
      if (!vehicle) {
        return res.status(404).json({ error: "Veículo não encontrado" });
      }
      
      res.json(vehicle);
    } catch (error) {
      console.error("Error fetching vehicle:", error);
      res.status(500).json({ error: "Erro ao buscar veículo" });
    }
  });

  app.post("/api/vehicles", async (req, res) => {
    try {
      const vehicleData = insertVehicleSchema.parse(req.body);
      const vehicle = await storage.createVehicle(vehicleData);
      res.json(vehicle);
    } catch (error) {
      console.error("Error creating vehicle:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Dados inválidos", details: error.errors });
      }
      res.status(500).json({ error: "Erro ao criar veículo" });
    }
  });

  app.put("/api/vehicles/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = insertVehicleSchema.partial().parse(req.body);
      const vehicle = await storage.updateVehicle(id, updateData);
      
      if (!vehicle) {
        return res.status(404).json({ error: "Veículo não encontrado" });
      }
      
      res.json(vehicle);
    } catch (error) {
      console.error("Error updating vehicle:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Dados inválidos", details: error.errors });
      }
      res.status(500).json({ error: "Erro ao atualizar veículo" });
    }
  });

  app.delete("/api/vehicles/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteVehicle(id);
      
      if (!deleted) {
        return res.status(404).json({ error: "Veículo não encontrado" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting vehicle:", error);
      res.status(500).json({ error: "Erro ao excluir veículo" });
    }
  });

  // Campaigns routes
  app.get("/api/campaigns", async (req, res) => {
    try {
      const campaigns = await storage.getCampaigns();
      res.json(campaigns);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      res.status(500).json({ error: "Erro ao buscar campanhas" });
    }
  });

  app.get("/api/campaigns/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const campaign = await storage.getCampaign(id);
      
      if (!campaign) {
        return res.status(404).json({ error: "Campanha não encontrada" });
      }
      
      res.json(campaign);
    } catch (error) {
      console.error("Error fetching campaign:", error);
      res.status(500).json({ error: "Erro ao buscar campanha" });
    }
  });

  app.post("/api/campaigns", async (req, res) => {
    try {
      const campaignData = insertCampaignSchema.parse(req.body);
      const campaign = await storage.createCampaign(campaignData);
      res.json(campaign);
    } catch (error) {
      console.error("Error creating campaign:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Dados inválidos", details: error.errors });
      }
      res.status(500).json({ error: "Erro ao criar campanha" });
    }
  });

  app.put("/api/campaigns/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = insertCampaignSchema.partial().parse(req.body);
      const campaign = await storage.updateCampaign(id, updateData);
      
      if (!campaign) {
        return res.status(404).json({ error: "Campanha não encontrada" });
      }
      
      res.json(campaign);
    } catch (error) {
      console.error("Error updating campaign:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Dados inválidos", details: error.errors });
      }
      res.status(500).json({ error: "Erro ao atualizar campanha" });
    }
  });

  app.delete("/api/campaigns/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteCampaign(id);
      
      if (!deleted) {
        return res.status(404).json({ error: "Campanha não encontrada" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting campaign:", error);
      res.status(500).json({ error: "Erro ao excluir campanha" });
    }
  });

  // API Keys routes (protected)
  app.get("/api/api-keys", authenticate, async (req: any, res) => {
    try {
      const apiKeys = await storage.getApiKeys(req.user.id);
      // Don't return the actual key value for security
      const safeKeys = apiKeys.map(key => ({
        ...key,
        key: key.key.substring(0, 12) + "..." + key.key.substring(key.key.length - 4)
      }));
      res.json(safeKeys);
    } catch (error) {
      console.error("Error fetching API keys:", error);
      res.status(500).json({ error: "Erro ao buscar chaves de API" });
    }
  });

  app.post("/api/api-keys", authenticate, async (req: any, res) => {
    try {
      const keyData = insertApiKeySchema.parse(req.body);
      const apiKey = await storage.createApiKey({ ...keyData, userId: req.user.id });
      res.json(apiKey);
    } catch (error) {
      console.error("Error creating API key:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Dados inválidos", details: error.errors });
      }
      res.status(500).json({ error: "Erro ao criar chave de API" });
    }
  });

  app.delete("/api/api-keys/:id", authenticate, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteApiKey(id);
      
      if (!deleted) {
        return res.status(404).json({ error: "Chave de API não encontrada" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting API key:", error);
      res.status(500).json({ error: "Erro ao excluir chave de API" });
    }
  });

  // Metrics route
  app.get("/api/metrics", async (req, res) => {
    try {
      const metrics = await storage.getMetrics();
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching metrics:", error);
      res.status(500).json({ error: "Erro ao buscar métricas" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
