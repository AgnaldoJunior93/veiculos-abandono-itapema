import { pgTable, text, serial, integer, boolean, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  matricula: text("matricula").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(), // "Administrador" | "Padrão"
});

export const vehicles = pgTable("vehicles", {
  id: serial("id").primaryKey(),
  placa: text("placa").notNull(),
  endereco: text("endereco").notNull(),
  dataNotificacao: date("data_notificacao").notNull(),
  prazoFinal: date("prazo_final").notNull(),
  status: text("status").notNull(), // "aguardando_remocao" | "removido_patio" | "removido_proprietario"
  agente: text("agente").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const campaigns = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  descricao: text("descricao"),
  area: text("area").notNull(),
  dataInicio: date("data_inicio").notNull(),
  dataFim: date("data_fim").notNull(),
  status: text("status").notNull(), // "planejada" | "ativa" | "finalizada" | "cancelada"
  metaEngajamento: integer("meta_engajamento"),
  engajamentoAtual: integer("engajamento_atual").default(0),
  remocoesPrevias: integer("remocoes_previas").default(0),
  remocoesPosCampanha: integer("remocoes_pos_campanha").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const apiKeys = pgTable("api_keys", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  key: text("key").notNull().unique(),
  userId: integer("user_id").references(() => users.id).notNull(),
  active: boolean("active").default(true).notNull(),
  lastUsed: timestamp("last_used"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
});

export const insertVehicleSchema = createInsertSchema(vehicles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCampaignSchema = createInsertSchema(campaigns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertApiKeySchema = createInsertSchema(apiKeys).omit({
  id: true,
  key: true,
  lastUsed: true,
  createdAt: true,
}).extend({
  name: z.string().min(1, "Nome é obrigatório"),
});

export const loginSchema = z.object({
  matricula: z.string().min(1, "Matrícula é obrigatória"),
  password: z.string().min(1, "Senha é obrigatória"),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertVehicle = z.infer<typeof insertVehicleSchema>;
export type Vehicle = typeof vehicles.$inferSelect;
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;
export type Campaign = typeof campaigns.$inferSelect;
export type InsertApiKey = z.infer<typeof insertApiKeySchema>;
export type ApiKey = typeof apiKeys.$inferSelect;
export type LoginRequest = z.infer<typeof loginSchema>;
