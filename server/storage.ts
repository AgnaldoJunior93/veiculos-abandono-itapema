import { users, vehicles, apiKeys, type User, type InsertUser, type Vehicle, type InsertVehicle, type ApiKey, type InsertApiKey } from "@shared/schema";
import { nanoid } from "nanoid";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByMatricula(matricula: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Vehicles
  getVehicles(): Promise<Vehicle[]>;
  getVehicle(id: number): Promise<Vehicle | undefined>;
  createVehicle(vehicle: InsertVehicle): Promise<Vehicle>;
  updateVehicle(id: number, vehicle: Partial<InsertVehicle>): Promise<Vehicle | undefined>;
  deleteVehicle(id: number): Promise<boolean>;
  
  // API Keys
  getApiKeys(userId: number): Promise<ApiKey[]>;
  getApiKeyByKey(key: string): Promise<ApiKey | undefined>;
  createApiKey(apiKey: InsertApiKey & { userId: number }): Promise<ApiKey>;
  deleteApiKey(id: number): Promise<boolean>;
  updateApiKeyLastUsed(key: string): Promise<void>;
  
  // Metrics
  getMetrics(): Promise<{
    totalVehicles: number;
    overdueVehicles: number;
    removalRate: number;
    vehiclesByStatus: Record<string, number>;
  }>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private vehicles: Map<number, Vehicle>;
  private apiKeys: Map<number, ApiKey>;
  private currentUserId: number;
  private currentVehicleId: number;
  private currentApiKeyId: number;

  constructor() {
    this.users = new Map();
    this.vehicles = new Map();
    this.apiKeys = new Map();
    this.currentUserId = 1;
    this.currentVehicleId = 1;
    this.currentApiKeyId = 1;
    
    // Initialize with default users
    this.initializeData();
  }

  private async initializeData() {
    // Create default users
    await this.createUser({
      matricula: "12345",
      password: "admin",
      name: "João Silva",
      type: "Administrador"
    });
    
    await this.createUser({
      matricula: "67890", 
      password: "user",
      name: "Maria Santos",
      type: "Padrão"
    });
    
    await this.createUser({
      matricula: "12937",
      password: "garcia", 
      name: "Agnaldo",
      type: "Administrador"
    });
    
    await this.createUser({
      matricula: "12345",
      password: "user",
      name: "Padrão", 
      type: "Padrão"
    });
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByMatricula(matricula: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.matricula === matricula,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Vehicles
  async getVehicles(): Promise<Vehicle[]> {
    return Array.from(this.vehicles.values());
  }

  async getVehicle(id: number): Promise<Vehicle | undefined> {
    return this.vehicles.get(id);
  }

  async createVehicle(insertVehicle: InsertVehicle): Promise<Vehicle> {
    const id = this.currentVehicleId++;
    const now = new Date();
    const vehicle: Vehicle = { 
      ...insertVehicle, 
      id, 
      createdAt: now,
      updatedAt: now
    };
    this.vehicles.set(id, vehicle);
    return vehicle;
  }

  async updateVehicle(id: number, updateData: Partial<InsertVehicle>): Promise<Vehicle | undefined> {
    const existing = this.vehicles.get(id);
    if (!existing) return undefined;
    
    const updated: Vehicle = {
      ...existing,
      ...updateData,
      updatedAt: new Date()
    };
    this.vehicles.set(id, updated);
    return updated;
  }

  async deleteVehicle(id: number): Promise<boolean> {
    return this.vehicles.delete(id);
  }



  // API Keys
  async getApiKeys(userId: number): Promise<ApiKey[]> {
    return Array.from(this.apiKeys.values()).filter(key => key.userId === userId);
  }

  async getApiKeyByKey(key: string): Promise<ApiKey | undefined> {
    return Array.from(this.apiKeys.values()).find(apiKey => apiKey.key === key);
  }

  async createApiKey(data: InsertApiKey & { userId: number }): Promise<ApiKey> {
    const id = this.currentApiKeyId++;
    const key = `sk_prod_${nanoid(32)}`;
    const apiKey: ApiKey = {
      id,
      name: data.name,
      key,
      userId: data.userId,
      active: true,
      lastUsed: null,
      createdAt: new Date()
    };
    this.apiKeys.set(id, apiKey);
    return apiKey;
  }

  async deleteApiKey(id: number): Promise<boolean> {
    return this.apiKeys.delete(id);
  }

  async updateApiKeyLastUsed(key: string): Promise<void> {
    const apiKey = await this.getApiKeyByKey(key);
    if (apiKey) {
      const updated = { ...apiKey, lastUsed: new Date() };
      this.apiKeys.set(apiKey.id, updated);
    }
  }

  // Metrics
  async getMetrics() {
    const vehicles = await this.getVehicles();
    
    const totalVehicles = vehicles.length;
    const now = new Date();
    const overdueVehicles = vehicles.filter(v => new Date(v.prazoFinal) < now && v.status === "aguardando_remocao").length;
    
    const removedVehicles = vehicles.filter(v => v.status !== "aguardando_remocao").length;
    const removalRate = totalVehicles > 0 ? Math.round((removedVehicles / totalVehicles) * 100) : 0;
    
    const vehiclesByStatus = vehicles.reduce((acc, vehicle) => {
      acc[vehicle.status] = (acc[vehicle.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalVehicles,
      overdueVehicles,
      removalRate,
      vehiclesByStatus
    };
  }
}

export const storage = new MemStorage();
