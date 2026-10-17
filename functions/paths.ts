import path from "node:path";
import { fileURLToPath } from "node:url";

export const projectRoot = fileURLToPath(new URL("../", import.meta.url));
export const databasePath = (name: string) => path.join(projectRoot, "database", name);
export const projectFile = (name: string) => path.join(projectRoot, name);
