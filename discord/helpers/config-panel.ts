// @ts-nocheck
import { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from "discord.js";
import { getSettings } from "../../functions/data.ts";
import { packageVersion } from "../../functions/version.ts";
import * as configMenu from "../menus/config/config.ts";
import * as customizeMenu from "../menus/config/customize.ts";
import * as logsMenu from "../menus/config/logs.ts";
function buildNameModal(){ return new ModalBuilder().setCustomId("cfg:customize:name:modal").setTitle("Alterar nome do bot").addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("name").setLabel("Novo nome").setStyle(TextInputStyle.Short).setRequired(true).setMinLength(2).setMaxLength(32))); }
function buildIconModal(){ return new ModalBuilder().setCustomId("cfg:customize:icon:modal").setTitle("Alterar ícone do bot").addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("url").setLabel("URL da imagem (ícone)").setStyle(TextInputStyle.Short).setRequired(true).setMinLength(8).setMaxLength(300))); }
function buildBannerModal(){ return new ModalBuilder().setCustomId("cfg:customize:banner:modal").setTitle("Alterar banner do bot").addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("url").setLabel("URL da imagem (banner)").setStyle(TextInputStyle.Short).setRequired(true).setMinLength(8).setMaxLength(300))); }
async function getConfigPanelContext(client,username){const s=await getSettings();const u=client.user;return {botVersion:s.botVersion||packageVersion(),botName:u?.username||"Bot",botAvatar:u?.displayAvatarURL?.({size:256})||null,botBanner:u?.bannerURL?.({size:512})||null,logs:s.logs||{},username};}
async function buildConfigPanelFromClient(client,username){return configMenu.buildConfigPanel(await getConfigPanelContext(client,username));}
async function buildCustomizePanelFromClient(client){return customizeMenu.buildCustomizePanel(await getConfigPanelContext(client));}
async function buildLogsPanelFromClient(client){return logsMenu.buildLogsPanel(await getConfigPanelContext(client));}
export const buildConfigPanel = configMenu.buildConfigPanel;
export const buildCustomizePanel = customizeMenu.buildCustomizePanel;
export const buildLogsPanel = logsMenu.buildLogsPanel;
export { buildNameModal, buildIconModal, buildBannerModal, getConfigPanelContext, buildConfigPanelFromClient, buildCustomizePanelFromClient, buildLogsPanelFromClient };
