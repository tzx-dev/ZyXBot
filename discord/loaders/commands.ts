import { Collection } from "discord.js";
import ping from "../commands/public/ping.ts";
import panel from "../commands/public/panel.ts";
import sendPanel from "../commands/public/send-panel.ts";
import oauth2 from "../commands/public/oauth2.ts";

export function loadCommands() {
  const commands = new Collection<string, any>();
  for (const command of [ping, panel, sendPanel, oauth2]) commands.set(command.data.name, command);
  return commands;
}

export function getCommandsJson(commands: Collection<string, any>) {
  return [...commands.values()].map(command => command.data.toJSON());
}
