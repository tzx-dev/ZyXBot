// @ts-nocheck
import { bot } from "./manager-runtime.ts";
export async function openOAuth2BotManager(interaction: any) { return bot.gerenciarbot(interaction.client, interaction); }
