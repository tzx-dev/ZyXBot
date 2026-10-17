import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { cv2Payload } from "../../../discord/helpers/components.ts";
import { buildConfigPanelFromClient } from "../../../discord/helpers/config-panel.ts";
import { getOwnerId } from "../../../functions/permissions.ts";
import { getSettings } from "../../../functions/data.ts";
export const data = new SlashCommandBuilder().setName("panel").setDescription("[🧿] Abrir o painel de configuração do bot");
export async function run(interaction: any) { const s=await getSettings(); const allowed=(getOwnerId()&&interaction.user.id===getOwnerId())||(s.panelUsers||[]).includes(interaction.user.id)||interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild); if(!allowed)return void interaction.reply({content:"Sem permissão.",ephemeral:true}); await interaction.reply(cv2Payload(await buildConfigPanelFromClient(interaction.client,interaction.user.username),{ephemeral:true})); }
export default { data, name: "panel", description: "[🧿] Abrir o painel de configuração do bot", run };
