import {
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  MessageFlags,
  SectionBuilder,
  SeparatorBuilder,
  TextDisplayBuilder
} from "discord.js";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
const { registros } = require("../../../database/oauth2/index.ts");
const bannerPath = path.resolve("functions/oauth2/imagens/banners/banner.png");

export function buildOAuth2SalesContainer() {
  const total = registros.fetchAll().length;

  const presentationSection = new SectionBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        "-# `🚀` ・Apresentamos o **NubZ OAuth2**, nossa solução OAuth2 desenvolvida para oferecer mais segurança, praticidade e automação para o seu servidor."
      )
    )
    .setButtonAccessory(
      new ButtonBuilder()
        .setCustomId("configurarOauth2")
        .setEmoji("<:slakk:1545061649680040016>")
        .setStyle(ButtonStyle.Secondary)
    );

  return new ContainerBuilder()
    .addMediaGalleryComponents(
      new MediaGalleryBuilder().addItems(
        new MediaGalleryItemBuilder().setURL("attachment://banner.png")
      )
    )
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent("# `🔐` ・NubZ OAuth2")
    )
    .addSectionComponents(presentationSection)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        "-# `⚙️` ・**Configuração Completa**\n-# Tenha controle sobre o funcionamento do seu OAuth2 e configure o sistema de acordo com as necessidades do seu servidor."
      ),
      new TextDisplayBuilder().setContent(
        "-# `💾` ・**Backup e Recuperação**\n-# Conte com sistemas de backup e recuperação para facilitar a restauração da estrutura do servidor em situações de troca ou problemas com o BOT."
      ),
      new TextDisplayBuilder().setContent(
        "-# `⚡` ・**API Própria**\n-# O **NubZ OAuth2** conta com uma API independente, permitindo que os sistemas funcionem de forma integrada e eficiente."
      )
    )
    .addSeparatorComponents(
      new SeparatorBuilder()
        .setDivider(true)
        .setSpacing("Small")
    )
    .addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("resgatarbot")
          .setLabel("Resgatar Authenticator")
          .setEmoji("<:shop:1543381552992358540>")
          .setStyle(ButtonStyle.Secondary),

        new ButtonBuilder()
          .setCustomId("registeredOauthCount")
          .setLabel(`OAuth2 Registrados: ${total}`)
          .setEmoji("<:emoji_1:1543381441646301288>")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true)
      )
    );
}

export function getOAuth2SalesAttachment() {
  return new AttachmentBuilder(bannerPath, { name: "banner.png" });
}

export async function sendOAuth2SalesPanel(interaction: any) {
  return interaction.reply({
    components: [buildOAuth2SalesContainer()],
    files: [getOAuth2SalesAttachment()],
    flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2
  });
}
