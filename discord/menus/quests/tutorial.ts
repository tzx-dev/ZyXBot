// @ts-nocheck
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ContainerBuilder, SectionBuilder, SeparatorBuilder, StringSelectMenuBuilder, TextDisplayBuilder, ThumbnailBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from "discord.js";
import { getQuestName, getRewardName, getTaskType, getTimeRemaining, questId, FILTER_LABELS, avatarUrl, premiumLabel } from "../../../discord/api/quests.ts";
import { greetingLine } from "../../../functions/greeting.ts";
import { packageVersion } from "../../../functions/version.ts";


function truncate(str, max) {
  const s = String(str || "");
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

function formatDuration(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}

function progressBar(done, total, width = 12) {
  const pct = total <= 0 ? 1 : Math.min(1, Math.max(0, done / total));
  const filled = Math.round(pct * width);
  const bar = "#".repeat(filled) + "-".repeat(width - filled);
  return `\`[${bar}]\` \`${Math.floor(pct * 100)}%\``;
}

function buildTokenTutorialPanel() {
  return new ContainerBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent("# Tutorial — pegar o token"),
      new TextDisplayBuilder().setContent(
        [
          "`1` Abra o Discord no navegador ou app desktop.",
          "`2` Pressione `F12` e vá em **Console**.",
          "`3` Digite `allow pasting` e Enter (se pedir).",
          "`4` Cole o comando abaixo e Enter:",
          "",
          "```js",
          "(()=>{for(let e of Object.values(webpackChunkdiscord_app.push([[Symbol()],{},e=>e.c])))try{if(!e.exports||e.exports===window)continue;if(e.exports?.getToken)return e.exports.getToken();for(let t in e.exports)if(e.exports?.[t]?.getToken&&\"IntlMessagesProxy\"!==e.exports[t][Symbol.toStringTag])return e.exports[t].getToken()}catch{}})();",
          "```",
          "",
          "`5` Copie o token e use **Enviar o token**."
        ].join("\n")
      )
    )
    .addSeparatorComponents(new SeparatorBuilder().setSpacing("Small").setDivider(true))
    .addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId("quest:config:action")
          .setPlaceholder("Selecione uma opção")
          .addOptions(
            {
              label: "Enviar o token",
              description: "Abrir formulário para colar o token",
              value: "send_token",
              emoji: "🔑"
            },
            {
              label: "Tutorial de como pegar o token",
              description: "Ver este tutorial novamente",
              value: "tutorial",
              emoji: "📘"
            }
          )
      )
    );
}

export {buildTokenTutorialPanel};
