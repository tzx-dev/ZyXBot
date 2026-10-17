import { commands } from "./commands.ts";
import ready from "./events/ready.ts";
import interactionCreate from "./events/interaction-create.ts";

export const events = [ready, interactionCreate];
export { commands };
export async function load() { return { commands, events }; }
