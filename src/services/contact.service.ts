import type { PrismaClient } from "../generated/prisma"
import Database from "../config/database"
import type { Contact, ConsolidatedContact, IdentifyRequest } from "../types/contact.types"
import logger from "../utils/logger"
import { createInternalServerError } from "../utils/errorHandler"

export class ContactService {
  private prisma: PrismaClient

  constructor() {
    this.prisma = Database.getInstance()
  }

  async identifyContact(request: IdentifyRequest): Promise<ConsolidatedContact> {
    try {
      logger.info("Starting contact identification", { request })

      const { email, phoneNumber } = request

      // Find existing contacts that match email or phone number
      const existingContacts = await this.findMatchingContacts(email, phoneNumber)

      if (existingContacts.length === 0) {
        // No matching contacts found, create new primary contact
        const newContact = await this.createPrimaryContact(email, phoneNumber)
        logger.info("Created new primary contact", { contactId: newContact.id })

        return this.buildConsolidatedContact([newContact])
      }

      // Get all related contacts (primary and secondary)
      const allRelatedContacts = await this.getAllRelatedContacts(existingContacts)

      // Check if we need to create a new secondary contact
      const needsNewSecondary = this.shouldCreateSecondaryContact(allRelatedContacts, email, phoneNumber)

      if (needsNewSecondary) {
        const primaryContact = this.findPrimaryContact(allRelatedContacts)
        const newSecondary = await this.createSecondaryContact(email, phoneNumber, primaryContact.id)
        logger.info("Created new secondary contact", {
          contactId: newSecondary.id,
          linkedTo: primaryContact.id,
        })

        allRelatedContacts.push(newSecondary)
      }

      // Check if we need to merge different primary contacts
      const primaryContacts = allRelatedContacts.filter((contact) => contact.linkPrecedence === "primary")

      if (primaryContacts.length > 1) {
        await this.mergePrimaryContacts(primaryContacts)
        logger.info("Merged primary contacts", {
          primaryContactIds: primaryContacts.map((c) => c.id),
        })

        // Refresh the contacts after merge
        const refreshedContacts = await this.getAllRelatedContacts(primaryContacts)
        return this.buildConsolidatedContact(refreshedContacts)
      }

      return this.buildConsolidatedContact(allRelatedContacts)
    } catch (error) {
      logger.error("Error in contact identification:", error)
      throw createInternalServerError("Failed to identify contact")
    }
  }

  private async findMatchingContacts(email?: string, phoneNumber?: string): Promise<Contact[]> {
    const whereConditions = []

    if (email) {
      whereConditions.push({ email })
    }

    if (phoneNumber) {
      whereConditions.push({ phoneNumber })
    }

    return await this.prisma.contact.findMany({
      where: {
        OR: whereConditions,
        deletedAt: null,
      },
      orderBy: { createdAt: "asc" },
    }) as Contact[]
  }

  private async getAllRelatedContacts(contacts: Contact[]): Promise<Contact[]> {
    const contactIds = new Set<number>()
    const primaryIds = new Set<number>()

    // Collect all contact IDs and find primary IDs
    contacts.forEach((contact) => {
      contactIds.add(contact.id)
      if (contact.linkPrecedence === "primary") {
        primaryIds.add(contact.id)
      } else if (contact.linkedId) {
        primaryIds.add(contact.linkedId)
      }
    })

    // Find all contacts linked to these primary contacts
    const allRelatedContacts = await this.prisma.contact.findMany({
      where: {
        OR: [{ id: { in: Array.from(primaryIds) } }, { linkedId: { in: Array.from(primaryIds) } }],
        deletedAt: null,
      },
      orderBy: { createdAt: "asc" },
    }) as Contact[]

    return allRelatedContacts
  }

  private shouldCreateSecondaryContact(existingContacts: Contact[], email?: string, phoneNumber?: string): boolean {
    const existingEmails = new Set(existingContacts.map((c) => c.email).filter(Boolean))
    const existingPhones = new Set(existingContacts.map((c) => c.phoneNumber).filter(Boolean))

    const hasNewEmail = email && !existingEmails.has(email)
    const hasNewPhone = phoneNumber && !existingPhones.has(phoneNumber)

    return Boolean(hasNewEmail || hasNewPhone)
  }

  private findPrimaryContact(contacts: Contact[]): Contact {
    const primaryContact = contacts.find((contact) => contact.linkPrecedence === "primary")
    if (!primaryContact) {
      throw new Error("No primary contact found")
    }
    return primaryContact
  }

  private async createPrimaryContact(email?: string, phoneNumber?: string): Promise<Contact> {
    return await this.prisma.contact.create({
      data: {
        email: email || null,
        phoneNumber: phoneNumber || null,
        linkPrecedence: "primary",
      },
    }) as Contact
  }

  private async createSecondaryContact(email?: string, phoneNumber?: string, linkedId?: number): Promise<Contact> {
    return await this.prisma.contact.create({
      data: {
        email: email || null,
        phoneNumber: phoneNumber || null,
        linkedId: linkedId || null,
        linkPrecedence: "secondary",
      },
    }) as Contact
  }

  private async mergePrimaryContacts(primaryContacts: Contact[]): Promise<void> {
    // Sort by creation date to find the oldest (which becomes the main primary)
    const sortedPrimaries = [...primaryContacts].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())

    const mainPrimary = sortedPrimaries[0]
    if (!mainPrimary) {
      throw new Error("No primary contact found for merging")
    }

    const contactsToUpdate = sortedPrimaries.slice(1)

    // Update other primary contacts to become secondary
    for (const contact of contactsToUpdate) {
      await this.prisma.contact.update({
        where: { id: contact.id },
        data: {
          linkPrecedence: "secondary",
          linkedId: mainPrimary.id,
        },
      })

      // Update any contacts that were linked to this contact
      await this.prisma.contact.updateMany({
        where: { linkedId: contact.id },
        data: { linkedId: mainPrimary.id },
      })
    }
  }

  private buildConsolidatedContact(contacts: Contact[]): ConsolidatedContact {
    const primaryContact = contacts.find((c) => c.linkPrecedence === "primary")!
    const secondaryContacts = contacts.filter((c) => c.linkPrecedence === "secondary")

    const emails = Array.from(new Set(contacts.map((c) => c.email).filter(Boolean))) as string[]

    const phoneNumbers = Array.from(new Set(contacts.map((c) => c.phoneNumber).filter(Boolean))) as string[]

    // Sort emails and phone numbers to ensure primary contact's info comes first
    const sortedEmails = this.sortContactInfo(emails, primaryContact.email)
    const sortedPhoneNumbers = this.sortContactInfo(phoneNumbers, primaryContact.phoneNumber)

    return {
      primaryContactId: primaryContact.id,
      emails: sortedEmails,
      phoneNumbers: sortedPhoneNumbers,
      secondaryContactIds: secondaryContacts.map((c) => c.id),
    }
  }

  private sortContactInfo(items: string[], primaryItem: string | null): string[] {
    if (!primaryItem) return items

    const result = [primaryItem]
    items.forEach((item) => {
      if (item !== primaryItem) {
        result.push(item)
      }
    })

    return result
  }
}