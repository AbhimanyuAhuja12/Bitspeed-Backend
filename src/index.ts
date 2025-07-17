import dotenv from "dotenv"
import App from "./app"
import Database from "./config/database"
import logger from "./utils/logger"

// Load environment variables
dotenv.config()

const PORT = process.env["PORT"] || 3000

async function startServer(): Promise<void> {
  try {
    // Connect to database
    await Database.connect()

    // Create Express app
    const app = new App()

    // Start server
    const server = app.app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`)
      logger.info(`Health check available at http://localhost:${PORT}/health`)
      logger.info(`Environment: ${process.env["NODE_ENV"] || "development"}`)
    })

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Starting graceful shutdown...`)

      server.close(async () => {
        logger.info("HTTP server closed")

        try {
          await Database.disconnect()
          logger.info("Database disconnected")
          process.exit(0)
        } catch (error) {
          logger.error("Error during shutdown:", error)
          process.exit(1)
        }
      })
    }

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"))
    process.on("SIGINT", () => gracefulShutdown("SIGINT"))
  } catch (error) {
    logger.error("Failed to start server:", error)
    process.exit(1)
  }
}

startServer()
