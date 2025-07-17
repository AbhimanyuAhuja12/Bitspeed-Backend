import type { Request, Response, NextFunction } from "express"
import type { IdentifyRequest } from "../types/contact.types"
import { createValidationError } from "../utils/errorHandler"

export const validateIdentifyRequest = (req: Request, _res: Response, next: NextFunction): void => {
  const { email, phoneNumber }: IdentifyRequest = req.body

  // At least one field must be present
  if (!email && !phoneNumber) {
    throw createValidationError("At least one of email or phoneNumber must be provided")
  }

  // Validate email format if provided
  if (email && !isValidEmail(email)) {
    throw createValidationError("Invalid email format")
  }

  // Validate phone number format if provided
  if (phoneNumber && !isValidPhoneNumber(phoneNumber)) {
    throw createValidationError("Invalid phone number format")
  }

  next()
}

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

const isValidPhoneNumber = (phoneNumber: string): boolean => {
  // Basic phone number validation (can be enhanced based on requirements)
  const phoneRegex = /^[+]?[1-9][\d]{0,15}$/
  return phoneRegex.test(phoneNumber.replace(/[\s\-$$$$]/g, ""))
}