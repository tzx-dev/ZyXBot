// @ts-nocheck
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelSelectMenuBuilder, ChannelType, ContainerBuilder, SectionBuilder, SeparatorBuilder, StringSelectMenuBuilder, TextDisplayBuilder, ThumbnailBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from "discord.js";
import { greetingLine } from "../../../functions/greeting.ts";
import { packageVersion } from "../../../functions/version.ts";

function buildCustomizePanel({ botName = "Bot", botAvatar, botBanner } = {}) {
  const header = new SectionBuilder().addTextDisplayComponents(
    new TextDisplayBuilder().setContent("# Personalizar bot"),
    new TextDisplayBuilder().setContent(
      [
        `\`🏷️\` Nome atual: **${botName}**`,
        `\`🖼️\` Ícone: ${botAvatar ? "`definido`" : "`padrão`"}`,
        `\`🌄\` Banner: ${botBanner ? "`definido`" : "`não definido / sem Nitro`"}`
      ].join("\n")
    )
  );

  if (botAvatar) {
    header.setThumbnailAccessory(new ThumbnailBuilder().setURL(botAvatar));
  }

  return new ContainerBuilder()
    .addSectionComponents(header)
    .addSeparatorComponents(new SeparatorBuilder().setSpacing("Large").setDivider(true))
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent("**Editar identidade**"),
      new TextDisplayBuilder().setContent(
        "Altere nome, ícone ou banner. Use URLs diretas de imagem (PNG/JPG/GIF/WEBP)."
      )
    )
    .addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("cfg:customize:name")
          .setLabel("Nome")
          .setEmoji("✏️")
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId("cfg:customize:icon")
          .setLabel("Ícone")
          .setEmoji("🖼️")
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId("cfg:customize:banner")
          .setLabel("Banner")
          .setEmoji("🌄")
          .setStyle(ButtonStyle.Primary)
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
export {buildCustomizePanel};
