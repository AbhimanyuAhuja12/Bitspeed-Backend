import { PrismaClient } from "../generated/prisma"
import logger from "../utils/logger"

class Database {
  private static instance: PrismaClient

  public static getInstance(): PrismaClient {
    if (!Database.instance) {
      Database.instance = new PrismaClient({
        log: ["info", "warn", "error"],
      })
    }

    return Database.instance
  }

  public static async connect(): Promise<void> {
    try {
      const prisma = Database.getInstance()
      await prisma.$connect()
      logger.info("Database connected successfully")
    } catch (error) {
      logger.error("Database connection failed:", error)
      throw error
    }
  }

  public static async disconnect(): Promise<void> {
    try {
      const prisma = Database.getInstance()
      await prisma.$disconnect()
      logger.info("Database disconnected successfully")
    } catch (error) {
      logger.error("Database disconnection failed:", error)
      throw error
    }
  }
}

export default Database