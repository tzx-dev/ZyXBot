import { auth } from "./manager-runtime.ts";

export async function openOAuth2Tokens(interaction: any) {
  return auth.gerenciarbot(interaction.client, interaction, 1);
}
