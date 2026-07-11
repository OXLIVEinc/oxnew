import 'dotenv/config';
import { startPurchaseWorker } from './purchase';

startPurchaseWorker();
console.log('🚀 OX purchase worker started');
