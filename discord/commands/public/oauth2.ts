import { SlashCommandBuilder } from "discord.js";
import { sendOAuth2SalesPanel } from "../../menus/oauth2/sales.ts";

export const data = new SlashCommandBuilder()
  .setName("oauth2")
  .setDescription("[🔐] Abrir o manager integrado do NubZ OAuth2");

export async function run(interaction: any) {
  return sendOAuth2SalesPanel(interaction);
}

export default { data, name: "oauth2", description: "[🔐] Abrir o manager integrado do NubZ OAuth2", run };
