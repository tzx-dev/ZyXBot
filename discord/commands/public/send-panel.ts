import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { cv2Payload } from "../../../discord/helpers/components.ts";
import { buildMainPanel } from "../../../discord/menus/quests/main.ts";
import { countAccounts } from "../../../functions/accounts.ts";
import { getActiveSessionCount, getStatusLabel } from "../../../functions/progress.ts";
import { getOwnerId } from "../../../functions/permissions.ts";
import { getSettings, setSettings } from "../../../functions/data.ts";
import { packageVersion } from "../../../functions/version.ts";
export const data = new SlashCommandBuilder().setName("send-panel").setDescription("[🧿] Enviar o painel de Auto-Quest");
export async function run(interaction: any) { const s=await getSettings(); const allowed=(getOwnerId()&&interaction.user.id===getOwnerId())||(s.panelUsers||[]).includes(interaction.user.id)||interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild); if(!allowed)return void interaction.reply({content:"Sem permissão.",ephemeral:true}); const panel=buildMainPanel({accounts:await countAccounts(),sessions:getActiveSessionCount(),status:getStatusLabel(),botVersion:s.botVersion||packageVersion(),botAvatar:interaction.client.user?.displayAvatarURL?.({size:128})} as any); const message=await interaction.channel.send(cv2Payload(panel)); s.panelMessage={channelId:message.channelId,messageId:message.id}; await setSettings(s); await interaction.reply({content:"Painel enviado.",ephemeral:true}); }
export default { data, name: "send-panel", description: "[🧿] Enviar o painel de Auto-Quest", run };
