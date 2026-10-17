import { REST, Routes, type ClientEvents } from "discord.js";
import { config } from "../../configs/config.ts";
import { commands } from "../commands.ts";
import { hydrateRuntimeFromDisk } from "../../functions/progress.ts";
import { resumeSessions } from "../../functions/runner.ts";

export const name: keyof ClientEvents = "clientReady";
export async function run(ready: ClientEvents["clientReady"][0]) {
  const rest = new REST({ version: "10" }).setToken(config.BOT_TOKEN);
  const body = commands.map(command => command.data.toJSON());
  if (config.GUILD_ID) await rest.put(Routes.applicationGuildCommands(ready.user.id, config.GUILD_ID), { body });
  else await rest.put(Routes.applicationCommands(ready.user.id), { body });
  await hydrateRuntimeFromDisk();
  await resumeSessions(ready);
  console.log(`✓ ${body.length} comando(s) registrado(s)`);
  console.log(`✓ ${ready.user.tag} online`);
}
export default { name, run };
