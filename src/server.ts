import { createServer } from "http";
import { createApp } from "./app";
import { env } from "@/config/env";
import { initSocket } from "@/lib/socket";
import { Request, Response, NextFunction } from "express";

const app = createApp();
const httpServer = createServer(app);

app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${req.method} ${req.originalUrl}`);
  next();
});

initSocket(httpServer);

httpServer.listen(env.PORT, () => {
  console.log(`[server] listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);
});
