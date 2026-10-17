// @ts-nocheck
import { ActionRowBuilder, ContainerBuilder, MessageFlags, SeparatorBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, TextDisplayBuilder } from "discord.js";
import { records } from "./manager-runtime.ts";

export function buildOAuth2ApplicationSelectContainer(user: any) {
  const applications = records.registros.fetchAll().filter((entry: any) => entry.data?.owner?.includes(user.id));
  const menu = new StringSelectMenuBuilder().setCustomId("selectOauth2Config").setPlaceholder("Selecione uma aplicação para gerenciar...").addOptions(
    applications.slice(0, 25).map((entry: any) => new StringSelectMenuOptionBuilder().setLabel(entry.data.name || entry.ID).setDescription(`ID da Aplicação: ${entry.ID}`).setValue(entry.ID))
  );
  return new ContainerBuilder().addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ⚙️ Configuração do OAuth2\n\nOlá **${user.globalName || user.username}**! Selecione a aplicação que deseja gerenciar:\n\n- Gerenciar tokens e Client Secrets\n- Acompanhar membros e servidores vinculados\n- Gerenciar assinatura e adicionais`)).addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing("Small")).addActionRowComponents(new ActionRowBuilder().addComponents(menu));
}

export async function openOAuth2ApplicationSelect(interaction: any) {
  const applications = records.registros.fetchAll().filter((entry: any) => entry.data?.owner?.includes(interaction.user.id));
  if (!applications.length) return interaction.reply({ content: "❌ Você não possui nenhuma aplicação OAuth2 registrada.", ephemeral: true });
  return interaction.reply({ components: [buildOAuth2ApplicationSelectContainer(interaction.user)], flags: MessageFlags.IsComponentsV2, ephemeral: true });
}
