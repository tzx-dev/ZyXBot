import advanceHandler from "./avancarevoltar.ts";
import cartHandler from "./carrinho.ts";
import pullEmailsHandler from "./pullemails.ts";
import pullRequestsHandler from "./pullrequests.ts";
import eventGeneralHandler from "../../menus/oauth2/containers/event-general.ts";
import subscriptionsHandler from "../../menus/oauth2/containers/subscriptions-handler.ts";
import botHandler from "../../menus/oauth2/containers/bot-handler.ts";
import serversHandler from "../../menus/oauth2/containers/servers-handler.ts";
import rescueHandler from "../../menus/oauth2/containers/rescue-handler.ts";
import readyHandler from "../../events/oauth2/ready.ts";

const interactionFiles = [advanceHandler, cartHandler, eventGeneralHandler, subscriptionsHandler, botHandler, serversHandler, pullEmailsHandler, pullRequestsHandler, rescueHandler];
let registered = false;

export function registerOAuth2Manager(client: any) {
  if (registered) return;
  registered = true;
  client.once("ready", () => void readyHandler.run(client));
}

export async function handleOAuth2Manager(interaction: any) {
  const client = interaction.client;
  for (const handler of interactionFiles) if (handler?.run) await handler.run(interaction, client);
}
