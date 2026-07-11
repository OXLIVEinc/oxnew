import { Router } from 'express';
import { getClaim, confirmClaim, declineClaim } from '../controllers/transfer.controller';

const router = Router();

router.get('/claim/:code', getClaim);
router.post('/claim/:code/confirm', confirmClaim);
router.post('/claim/:code/decline', declineClaim);

export default router;