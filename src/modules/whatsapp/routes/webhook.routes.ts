import { Router } from 'express';
import { whatsappWebhook, paystackWebhook } from '../controllers/webhook.controller';

const router = Router();

router.get('/whatsapp', whatsappWebhook.get);
router.post('/whatsapp', whatsappWebhook.post);
router.post('/paystack', paystackWebhook);

export default router;