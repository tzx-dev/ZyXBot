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

function buildProgressPanel({ quests = [], startedAt }) {
  const now = Date.now();
  const elapsed = formatDuration((now - (startedAt || now)) / 1000);

  const lines = quests.map(q => {
    const name = truncate(q.label || q.questId, 40);
    const needed = q.secondsNeeded || 0;
    const done = q.secondsDone || 0;
    const remaining = Math.max(0, needed - done);
    const bar = progressBar(done, needed || 1);
    const statusEmoji =
      q.status === "done" ? "✅" : q.status === "error" ? "❌" : q.status === "running" ? "🔄" : "⏳";

    if (q.status === "done") {
      return [
        `> \`${statusEmoji}\` **${name}**`,
        `> ${bar}`,
        `> \`✔️\` Concluída · tempo \`${formatDuration(q.elapsedSeconds || done)}\``
      ].join("\n");
    }

    if (q.status === "error") {
      return [
        `> \`${statusEmoji}\` **${name}**`,
        `> \`⚠️\` ${truncate(q.error || "erro", 80)}`
      ].join("\n");
    }

    return [
      `> \`${statusEmoji}\` **${name}**`,
      `> ${bar}`,
      `> \`⏱️\` ETA \`${formatDuration(remaining)}\` · feito \`${formatDuration(done)}\` / \`${formatDuration(needed)}\``
    ].join("\n");
  });

  const running = quests.filter(q => q.status === "running" || q.status === "pending").length;
  const done = quests.filter(q => q.status === "done").length;
  const failed = quests.filter(q => q.status === "error").length;
  const allDone = running === 0 && quests.length > 0;

  return new ContainerBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(allDone ? "# Sessão finalizada" : "# Quests em andamento"),
      new TextDisplayBuilder().setContent(
        [
          `\`⏱️\` Decorrido: \`${elapsed}\``,
          `\`🔄\` Ativas: \`${running}\` · \`✅\` Feitas: \`${done}\` · \`❌\` Erros: \`${failed}\``
        ].join("\n")
      )
    )
    .addSeparatorComponents(new SeparatorBuilder().setSpacing("Large").setDivider(true))
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(lines.join("\n\n") || "> Nenhuma quest na sessão.")
    )
    .addSeparatorComponents(new SeparatorBuilder().setSpacing("Small").setDivider(true))
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        allDone
          ? "-# Progresso salvo. Abra a engrenagem para novas quests."
          : "-# Progresso persistente — se o bot cair, a sessão será retomada."
      )
    );
}

export {buildProgressPanel};
