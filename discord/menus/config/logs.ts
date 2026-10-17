// @ts-nocheck
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelSelectMenuBuilder, ChannelType, ContainerBuilder, SectionBuilder, SeparatorBuilder, StringSelectMenuBuilder, TextDisplayBuilder, ThumbnailBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from "discord.js";
import { greetingLine } from "../../../functions/greeting.ts";
import { packageVersion } from "../../../functions/version.ts";

function channelMention(channelId) {
  return channelId ? `<#${channelId}>` : "`não configurado`";
}

function buildLogsPanel({ logs = {} } = {}) {
  return new ContainerBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent("# Logs do sistema"),
      new TextDisplayBuilder().setContent(
        "Selecione o canal para cada tipo de log. Canais já configurados aparecem abaixo."
      )
    )
    .addSeparatorComponents(new SeparatorBuilder().setSpacing("Large").setDivider(true))
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent("**Canais configurados**"),
      new TextDisplayBuilder().setContent(
        [
          `> \`🔑\` Login com token: ${channelMention(logs.login)}`,
          `> \`🔄\` Missões em andamento: ${channelMention(logs.questsRunning)}`,
          `> \`✅\` Missões completadas: ${channelMention(logs.questsCompleted)}`
        ].join("\n")
      )
    )
    .addSeparatorComponents(new SeparatorBuilder().setSpacing("Large").setDivider(true))
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent("**Login com token**"),
      new TextDisplayBuilder().setContent("Informações da conta ao conectar o token.")
    )
    .addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new ChannelSelectMenuBuilder()
          .setCustomId("cfg:logs:login")
          .setPlaceholder("Canal · log de login")
          .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
          .setMinValues(0)
          .setMaxValues(1)
      )
    )
    .addSeparatorComponents(new SeparatorBuilder().setSpacing("Small").setDivider(true))
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent("**Missões em andamento**"),
      new TextDisplayBuilder().setContent("Quando uma missão começa a ser executada.")
    )
    .addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new ChannelSelectMenuBuilder()
          .setCustomId("cfg:logs:running")
          .setPlaceholder("Canal · missões em andamento")
          .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
          .setMinValues(0)
          .setMaxValues(1)
      )
    )
    .addSeparatorComponents(new SeparatorBuilder().setSpacing("Small").setDivider(true))
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent("**Missões completadas**"),
      new TextDisplayBuilder().setContent("Quando uma missão é concluída (ou falha).")
    )
    .addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new ChannelSelectMenuBuilder()
          .setCustomId("cfg:logs:completed")
          .setPlaceholder("Canal · missões completadas")
          .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
          .setMinValues(0)
          .setMaxValues(1)
      )
    )
    .addSeparatorComponents(new SeparatorBuilder().setSpacing("Small").setDivider(true))
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent("**Limpar um log**")
    )
    .addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId("cfg:logs:clear")
          .setPlaceholder("Remover canal de um tipo de log")
          .addOptions(
            {
              label: "Limpar log de login",
              value: "login",
              emoji: "🔑"
            },
            {
              label: "Limpar missões em andamento",
              value: "questsRunning",
              emoji: "🔄"
            },
            {
              label: "Limpar missões completadas",
              value: "questsCompleted",
              emoji: "✅"
            }
          )
      )
    )
    .addSeparatorComponents(new SeparatorBuilder().setSpacing("Small").setDivider(true))
    .addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("cfg:back")
          .setLabel("Voltar")
          .setEmoji("⬅️")
          .setStyle(ButtonStyle.Secondary)
      )
    );
}
export {buildLogsPanel};
