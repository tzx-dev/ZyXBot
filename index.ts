import { Client, GatewayIntentBits } from "discord.js";
import { config } from "./configs/config.ts";
import { events } from "./discord/index.ts";
import { startOAuth2Server } from "./oauth2/server.ts";
import { registerOAuth2Manager } from "./discord/responders/oauth2/manager.ts";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.DirectMessages
  ]
});

registerOAuth2Manager(client);

for (const event of events) {
  client.on(event.name, (...args) => void (event.run as any)(...args));
}

startOAuth2Server(client);

client.login(config.BOT_TOKEN).catch(error => {
  console.error(error);
  process.exit(1);
});
