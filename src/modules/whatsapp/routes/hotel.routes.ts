import { Router } from 'express';
import { getHotelOrder, payHotelOrder } from '../controllers/hotel.controller';

const router = Router();

router.get('/:orderId', getHotelOrder);
router.post('/:orderId/pay', payHotelOrder);

export default router;