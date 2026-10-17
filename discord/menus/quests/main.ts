// @ts-nocheck
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  SectionBuilder,
  SeparatorBuilder,
  TextDisplayBuilder
} from "discord.js";
import { greetingLine } from "../../../functions/greeting.ts";
import { packageVersion } from "../../../functions/version.ts";

function buildMainPanel({ accounts = 0, sessions = 0, status = "Aguardando início", botVersion, username, botAvatar } = {}) {
  const version = botVersion || packageVersion();
  const header = new SectionBuilder().addTextDisplayComponents(
    new TextDisplayBuilder().setContent("# NubZ AutoQuest"),
    new TextDisplayBuilder().setContent(greetingLine(username)),
    new TextDisplayBuilder().setContent("Gerencie missões em várias contas do Discord e automatize missões elegíveis com NubZ.")
  ).setButtonAccessory(
    new ButtonBuilder().setCustomId("quest:accounts").setEmoji("<:slakk:1545061649680040016>").setStyle(ButtonStyle.Secondary)
  );

  return new ContainerBuilder()
    .addSectionComponents(header)
    .addSeparatorComponents(new SeparatorBuilder().setSpacing("Small").setDivider(true))
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent("**Estado do Sistema**"),
      new TextDisplayBuilder().setContent([
        `> \`👤\` Contas vinculadas: \`${accounts}\``,
        `> \`🚀\` Sessões ativas: \`${sessions}\` em execução`,
        `> \`◷\` Status geral: \`${status}\``,
        `> \`🔒\` Versão: \`${version}\``
      ].join("\n"))
    )
    .addSeparatorComponents(new SeparatorBuilder().setSpacing("Small").setDivider(true))
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent("**Funcionalidades**"),
      new TextDisplayBuilder().setContent([
        "> `🔥` **Multi-conta:** gerencie vários tokens no mesmo Discord",
        "> `↻` **Retomada:** sessões salvas se o bot reiniciar",
        "> `🎁` **Orbs:** saldo atual + feitos + projeção das disponíveis"
      ].join("\n"))
    )
    .addActionRowComponents(new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("quest:navigate").setLabel("Navegar").setEmoji("<:play:1549910479479115847>").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("quest:tutorial").setLabel("Tutorial token").setEmoji("<:mod_info:1549910481471275108>").setStyle(ButtonStyle.Secondary)
    ));
}

export { buildMainPanel };
