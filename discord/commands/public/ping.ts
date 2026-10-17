import { SlashCommandBuilder } from "discord.js";
import { cv2Payload, buildInteractionContext } from "../../../discord/helpers/components.ts";
import { buildExamplePanel } from "../../../discord/menus/examples/example.ts";
export const data = new SlashCommandBuilder().setName("ping").setDescription("Responde com Pong usando Components V2.");
export async function run(interaction: any) { await interaction.reply(cv2Payload(buildExamplePanel(buildInteractionContext(interaction)), { ephemeral: true })); }
export default { data, name: "ping", description: "Responde com Pong usando Components V2.", run };
