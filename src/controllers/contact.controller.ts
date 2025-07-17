import type { Request, Response, NextFunction } from "express"
import { StatusCodes } from "http-status-codes"
import { ContactService } from "../services/contact.service"
import type { IdentifyRequest, IdentifyResponse } from "../types/contact.types"
import logger from "../utils/logger"

export class ContactController {
  private contactService: ContactService

  constructor() {
    this.contactService = new ContactService()
  }

  identify = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const request: IdentifyRequest = req.body

      logger.info("Identify request received", {
        email: request.email ? "***@***.***" : undefined,
        phoneNumber: request.phoneNumber ? "***-***-****" : undefined,
        ip: req.ip,
      })

      const consolidatedContact = await this.contactService.identifyContact(request)

      const response: IdentifyResponse = {
        contact: {
          primaryContatctId: consolidatedContact.primaryContactId,
          emails: consolidatedContact.emails,
          phoneNumbers: consolidatedContact.phoneNumbers,
          secondaryContactIds: consolidatedContact.secondaryContactIds,
        },
      }

      logger.info("Identify request completed successfully", {
        primaryContactId: consolidatedContact.primaryContactId,
        emailCount: consolidatedContact.emails.length,
        phoneCount: consolidatedContact.phoneNumbers.length,
        secondaryCount: consolidatedContact.secondaryContactIds.length,
      })

      res.status(StatusCodes.OK).json(response)
    } catch (error) {
      next(error)
    }
  }
}
