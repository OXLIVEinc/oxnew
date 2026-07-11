import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import apiRouter from './routes';
import whatsappRouter from '@/modules/whatsapp/routes/index';
import { errorHandler } from '@/middleware/error.middleware';

// Messenger setup
import { setMessenger, setImageMessenger, setCtaUrlMessenger } from './modules/whatsapp/bot/messenger';
import { sendCloudTextMessage, sendCloudImageByUrl, sendCloudCtaUrlMessage } from './modules/whatsapp/lib/whatsapp';

export function createApp() {

const app = express();

app.use(express.json());

// CORS
app.use((req: Request, res: Response, next: NextFunction) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,PATCH,DELETE,OPTIONS"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

// API Routes
app.use('/api', apiRouter);
app.use("/api/w",whatsappRouter)

// Messenger wiring
setMessenger(async (phone: string, message: string) => {
  await sendCloudTextMessage(phone, message);
});

setImageMessenger(async (phone: string, imageUrl: string, caption?: string) => {
  await sendCloudImageByUrl(phone, imageUrl, caption);
});

setCtaUrlMessenger(async (phone, cta) => {
  await sendCloudCtaUrlMessage(phone, cta);
});

app.use(errorHandler);

return app;

}