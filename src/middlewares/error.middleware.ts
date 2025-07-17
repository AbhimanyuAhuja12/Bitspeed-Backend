import type { Request, Response, NextFunction } from "express"
import { StatusCodes } from "http-status-codes"
import { AppError, type ErrorResponse } from "../types/error.types"
import logger from "../utils/logger"

export const errorHandler = (error: Error | AppError, req: Request, res: Response, _next: NextFunction): void => {
  let statusCode = StatusCodes.INTERNAL_SERVER_ERROR
  let message = "Internal Server Error"

  if (error instanceof AppError) {
    statusCode = error.statusCode
    message = error.message
  }

  logger.error("Error occurred:", {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
  })

  const errorResponse: ErrorResponse = {
    success: false,
    message,
  }

  if (process.env["NODE_ENV"] === "development") {
    errorResponse.error = error.message
    if (error.stack) {
      errorResponse.stack = error.stack
    }
  }

  res.status(statusCode).json(errorResponse)
}

export const notFoundHandler = (req: Request, _res: Response, next: NextFunction): void => {
  const error = new AppError(`Route ${req.originalUrl} not found`, StatusCodes.NOT_FOUND)
  next(error)
}