import { z } from "zod";

// Schemas de validação
export const insertVehicleSchema = z.object({
  placa: z.string().min(7, "Placa inválida"),
  marca: z.string().min(2),
  modelo: z.string().min(2),
  cor: z.string().min(2),
  localizacao: z.string().min(2),
  prazoFinal: z.string().datetime().or(z.date()).optional() // 🛠️ correção importante
});

export const insertApiKeySchema = z.object({
  description: z.string().min(3),
});

export const loginSchema = z.object({
  matricula: z.string().min(1),
  password: z.string().min(1),
});

// Tipos inferidos
export type InsertVehicle = z.infer<typeof insertVehicleSchema>;
export type InsertApiKey = z.infer<typeof insertApiKeySchema>;
export type LoginData = z.infer<typeof loginSchema>;

// Tipos completos usados no "banco de dados"
export type Vehicle = InsertVehicle & {
  id: number;
  createdAt: Date;
  updatedAt: Date;
  status: "aguardando_remocao" | "removido" | "outro";
};

export type ApiKey = {
  id: number;
  description: string;
  key: string;
  userId: number;
  active: boolean;
  lastUsed: Date | null;
  createdAt: Date;
};

export type InsertUser = {
  matricula: string;
  password: string;
  name: string;
  type: "Administrador" | "Padrão";
};

export type User = InsertUser & {
  id: number;
};
