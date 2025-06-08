import {
  type User,
  type InsertUser,
  type Vehicle,
  type InsertVehicle,
  type ApiKey,
  type InsertApiKey,
} from "./schema";
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
  private users = new Map<number, User>();
  private vehicles = new Map<number, Vehicle>();
  private apiKeys = new Map<number, ApiKey>();
  private currentUserId = 1;
  private currentVehicleId = 1;
  private currentApiKeyId = 1;

  constructor() {
    this.initializeData();
  }

  private async initializeData() {
    await this.createUser({
      matricula: "12345",
      password: "admin",
      name: "João Silva",
      type: "Administrador",
    });

    await this.createUser({
      matricula: "67890",
      password: "user",
      name: "Maria Santos",
      type: "Padrão",
    });

    await this.createUser({
      matricula: "12937",
      password: "garcia",
      name: "Agnaldo",
      type: "Administrador",
    });

    await this.createUser({
      matricula: "54321",
      password: "user",
      name: "Padrão",
      type: "Padrão",
    });
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByMatricula(matricula: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find((user) => user.matricula === matricula);
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
      status: "aguardando_remocao",
      createdAt: now,
      updatedAt: now,
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
      updatedAt: new Date(),
    };
    this.vehicles.set(id, updated);
    return updated;
  }

  async deleteVehicle(id: number): Promise<boolean> {
    return this.vehicles.delete(id);
  }

  // API Keys
  async getApiKeys(userId: number): Promise<ApiKey[]> {
    return Array.from(this.apiKeys.values()).filter((key) => key.userId === userId);
  }

  async getApiKeyByKey(key: string): Promise<ApiKey | undefined> {
    return Array.from(this.apiKeys.values()).find((apiKey) => apiKey.key === key);
  }

  async createApiKey(data: InsertApiKey & { userId: number }): Promise<ApiKey> {
    const id = this.currentApiKeyId++;
    const key = `sk_prod_${nanoid(32)}`;
    const apiKey: ApiKey = {
      id,
      description: data.description,
      key,
      userId: data.userId,
      active: true,
      lastUsed: null,
      createdAt: new Date(),
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
    const now = new Date();

    const totalVehicles = vehicles.length;
    const overdueVehicles = vehicles.filter(
      (v) => v.prazoFinal && new Date(v.prazoFinal) < now && v.status === "aguardando_remocao"
    ).length;

    const removedVehicles = vehicles.filter((v) => v.status !== "aguardando_remocao").length;
    const removalRate = totalVehicles > 0 ? Math.round((removedVehicles / totalVehicles) * 100) : 0;

    const vehiclesByStatus = vehicles.reduce((acc, vehicle) => {
      acc[vehicle.status] = (acc[vehicle.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalVehicles,
      overdueVehicles,
      removalRate,
      vehiclesByStatus,
    };
  }
}

export const storage = new MemStorage();
