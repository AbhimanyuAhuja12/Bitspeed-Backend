import { Router } from "express"
import { ContactController } from "../controllers/contact.controller"
import { validateIdentifyRequest } from "../middlewares/validation.middleware"

const router = Router()
const contactController = new ContactController()

router.post("/identify", validateIdentifyRequest, contactController.identify)

export default router
