import { Router } from 'express';
import { getCheckout, submitCheckout } from '../controllers/ticket.controller';

const router = Router();

router.get('/:orderId', getCheckout);
router.post('/:orderId/submit', submitCheckout);

export default router;