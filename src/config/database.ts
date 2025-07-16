import { PrismaClient } from "@prisma/client"
import logger from "../utils/logger"

class Database {
  private static instance: PrismaClient

  public static getInstance(): PrismaClient {
    if (!Database.instance) {
      Database.instance = new PrismaClient({
        log: ["query", "info", "warn", "error"],
      })

      Database.instance.$on("query", (e) => {
        logger.debug("Query: " + e.query)
        logger.debug("Duration: " + e.duration + "ms")
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
