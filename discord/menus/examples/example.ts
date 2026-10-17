// @ts-nocheck
import { ContainerBuilder, SectionBuilder, TextDisplayBuilder, SeparatorBuilder, ThumbnailBuilder } from "discord.js";
function buildExamplePanel(ctx = {}) {
  const section = new SectionBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent("# Base Components V2"),
      new TextDisplayBuilder().setContent(
        `Olá ${ctx.user || "usuário"}!\n\nEsta é uma base pronta para bots Discord usando **Components V2**.\n\n- TextDisplay com markdown\n- Section com thumbnail\n- Separators e Containers\n- Botões e select menus dentro do container`
      )
    )
    .setThumbnailAccessory(
      new ThumbnailBuilder().setURL(ctx.botAvatar || ctx.userAvatar || "")
    );

  return new ContainerBuilder()
    .addSectionComponents(section)
    .addSeparatorComponents(new SeparatorBuilder().setSpacing("Large").setDivider(true))
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent("-# Servidor: `" + (ctx.guildName || "DM") + "`")
    );
}
export {buildExamplePanel};
