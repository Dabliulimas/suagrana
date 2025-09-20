import { PrismaClient } from "@prisma/client";
import { createClient } from "redis";
import { config } from "./config";
import { logger } from "@/utils/logger";

// Inicializar cliente Prisma
export const prisma = new PrismaClient({
  log: ["query", "info", "warn", "error"],
});

// Inicializar cliente Redis (será configurado apenas se disponível)
export let redisClient: any = null;
let redisAvailable = false;

// Função para inicializar Redis
const initializeRedis = async () => {
  try {
    const client = createClient({
      url: config.redis.url,
      password: config.redis.password,
    });

    // Event handlers para Redis
    client.on("error", (err) => {
      console.warn("⚠️ Redis Error (ignorando):", err.message);
    });

    client.on("connect", () => {
      console.log("✅ Redis conectado com sucesso");
      redisAvailable = true;
    });

    client.on("ready", () => {
      logger.info("Redis Client Ready");
    });

    client.on("end", () => {
      logger.info("Redis Client Disconnected");
      redisAvailable = false;
    });

    // Timeout de 2 segundos para conexão Redis
    const connectPromise = client.connect();
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Redis connection timeout")), 2000),
    );

    await Promise.race([connectPromise, timeoutPromise]);
    redisClient = client;
    return true;
  } catch (error) {
    console.warn(
      "⚠️ Redis não disponível, continuando sem cache:",
      error.message,
    );
    return false;
  }
};

// Função para conectar aos bancos de dados
export const connectDatabases = async (): Promise<void> => {
  try {
    // Testar conexão com Prisma
    await prisma.$connect();
    console.log("✅ Prisma conectado com sucesso");

    // Tentar conectar ao Redis (opcional)
    await initializeRedis();
  } catch (error) {
    console.error("❌ Erro ao conectar ao banco de dados principal:", error);
    throw error;
  }
};

// Função para desconectar dos bancos de dados
export const disconnectDatabases = async (): Promise<void> => {
  try {
    await prisma.$disconnect();

    if (redisClient && redisClient.isOpen) {
      await redisClient.quit();
    }

    console.log("✅ Bancos de dados desconectados com sucesso");
  } catch (error) {
    console.error("❌ Erro ao desconectar dos bancos de dados:", error);
  }
};
