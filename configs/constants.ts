import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const file = path.join(here, "..", "constants.json");
let constants: Record<string, unknown> = {};
try {
  constants = JSON.parse(fs.readFileSync(file, "utf8")) as Record<string, unknown>;
} catch {
  constants = {};
}

export { constants };
export default constants;
