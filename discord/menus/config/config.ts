// @ts-nocheck
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelSelectMenuBuilder, ChannelType, ContainerBuilder, SectionBuilder, SeparatorBuilder, StringSelectMenuBuilder, TextDisplayBuilder, ThumbnailBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from "discord.js";
import { greetingLine } from "../../../functions/greeting.ts";
import { packageVersion } from "../../../functions/version.ts";

function channelMention(channelId) {
  return channelId ? `<#${channelId}>` : "`não configurado`";
}

function buildConfigPanel({
  botVersion,
  botName = "Bot",
  botAvatar,
  logs = {},
  username
} = {}) {
  const version = botVersion || packageVersion();

  const header = new SectionBuilder().addTextDisplayComponents(
    new TextDisplayBuilder().setContent("# CONFIGURAÇÃO DO BOT"),
    new TextDisplayBuilder().setContent(greetingLine(username))
  );

  if (botAvatar) {
    header.setThumbnailAccessory(new ThumbnailBuilder().setURL(botAvatar));
  }

  return new ContainerBuilder()
    .addSectionComponents(header)
    .addSeparatorComponents(new SeparatorBuilder().setSpacing("Large").setDivider(true))
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent("**Estado atual**"),
      new TextDisplayBuilder().setContent(
        [
          `> \`📦\` Versão do bot: \`${version}\``,
          `> \`🤖\` Nome: **${botName}**`,
          `> \`🔑\` Log login: ${channelMention(logs.login)}`,
          `> \`🔄\` Log missões: ${channelMention(logs.questsRunning)}`,
          `> \`✅\` Log concluídas: ${channelMention(logs.questsCompleted)}`
        ].join("\n")
      )
    )
    .addSeparatorComponents(new SeparatorBuilder().setSpacing("Large").setDivider(true))
    .addSectionComponents(
      new SectionBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent("**NubZ OAuth2**"),
          new TextDisplayBuilder().setContent("Cadastre aplicações, gere links de autorização, acompanhe membros e configure o servidor principal.")
        )
        .setButtonAccessory(
          new ButtonBuilder()
            .setCustomId("cfg:oauth2")
            .setLabel("Configurar OAuth2")
            .setEmoji("🔐")
            .setStyle(ButtonStyle.Primary)
        )
    )
    .addSeparatorComponents(new SeparatorBuilder().setSpacing("Large").setDivider(true))
    .addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("cfg:customize")
          .setLabel("Personalizar")
          .setEmoji("🎨")
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId("cfg:logs")
          .setLabel("Logs")
          .setEmoji("📋")
          .setStyle(ButtonStyle.Secondary)
      )
    )
    .addSeparatorComponents(new SeparatorBuilder().setSpacing("Small").setDivider(true))
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        "-# Apenas owner / panelUsers · alterações aplicadas imediatamente"
      )
    );
}
export {buildConfigPanel};
