import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const getToursDataPath = () =>
  join(__dirname, "..", "dev-data", "data", "tours-simple.json");

export const getPublicPath = () => join(__dirname, "public");
