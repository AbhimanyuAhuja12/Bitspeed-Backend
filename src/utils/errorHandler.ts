import { StatusCodes } from "http-status-codes"
import { AppError } from "../types/error.types"

export const createError = (message: string, statusCode: number): AppError => {
  return new AppError(message, statusCode)
}

export const createValidationError = (message: string): AppError => {
  return new AppError(message, StatusCodes.BAD_REQUEST)
}

export const createNotFoundError = (message: string): AppError => {
  return new AppError(message, StatusCodes.NOT_FOUND)
}

export const createInternalServerError = (message: string): AppError => {
  return new AppError(message, StatusCodes.INTERNAL_SERVER_ERROR)
}

export const createConflictError = (message: string): AppError => {
  return new AppError(message, StatusCodes.CONFLICT)
}
