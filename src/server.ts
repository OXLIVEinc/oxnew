import { createServer } from "http";
import { createApp } from "./app";
import { env } from "@/config/env";
import { initSocket } from "@/lib/socket";

const app = createApp();
const httpServer = createServer(app);

initSocket(httpServer);

httpServer.listen(env.PORT, () => {
  console.log(`[server] listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);
});
