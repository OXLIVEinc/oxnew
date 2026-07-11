import "dotenv/config";

import { startPurchaseWorker } from "./purchase";

import {
  setMessenger,
  setImageMessenger,
  setCtaUrlMessenger,
} from "../bot/messenger";

import {
  sendCloudTextMessage,
  sendCloudImageByUrl,
  sendCloudCtaUrlMessage,
} from "../lib/whatsapp";

// Wire messenger implementations
setMessenger(async (phone, message) => {
    console.log('1')
  await sendCloudTextMessage(phone, message);
});

setImageMessenger(async (phone, imageUrl, caption) => {
    console.log('2')
  await sendCloudImageByUrl(phone, imageUrl, caption);
});

setCtaUrlMessenger(async (phone, cta) => {
  console.log('3')
  await sendCloudCtaUrlMessage(phone, cta);
});

startPurchaseWorker();

console.log("🚀 OX purchase worker started");