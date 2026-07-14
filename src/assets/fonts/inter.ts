import fs from "fs";
import path from "path";

export const interFont = fs
  .readFileSync(path.join(process.cwd(), "src/assets/fonts/Inter.ttf"))
  .toString("base64");