// @ts-nocheck
import { bot } from "./manager-runtime.ts";

export async function openOAuth2Backup(interaction: any) {
  return bot.gerenciarbot(interaction.client, interaction);
}
