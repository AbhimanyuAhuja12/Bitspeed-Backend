import express, { type Application } from "express"
import cors from "cors"
import helmet from "helmet"
import { StatusCodes } from "http-status-codes"

import contactRoutes from "./routes/contact.routes"
import { errorHandler, notFoundHandler } from "./middlewares/error.middleware"
import logger from "./utils/logger"

class App {
  public app: Application

  constructor() {
    this.app = express()
    this.initializeMiddlewares()
    this.initializeRoutes()
    this.initializeErrorHandling()
  }

  private initializeMiddlewares(): void {
    // Security middleware
    this.app.use(helmet())
    this.app.use(cors())

    // Body parsing middleware
    this.app.use(express.json({ limit: "10mb" }))
    this.app.use(express.urlencoded({ extended: true }))

    // Request logging
    this.app.use((req, _res, next) => {
      logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get("User-Agent"),
      })
      next()
    })
  }

  private initializeRoutes(): void {
    // Health check endpoint
    this.app.get("/health", (_req, res) => {
      res.status(StatusCodes.OK).json({
        status: "OK",
        timestamp: new Date().toISOString(),
        service: "Bitespeed Identity Reconciliation",
      })
    })

    // API routes
    this.app.use("/", contactRoutes)
  }

  private initializeErrorHandling(): void {
    // 404 handler
    this.app.use(notFoundHandler)

    // Global error handler
    this.app.use(errorHandler)
  }
}

export default App