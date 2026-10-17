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

function buildNoticeContainer(title, description) {
  return new ContainerBuilder().addTextDisplayComponents(
    new TextDisplayBuilder().setContent(`# ${title}`),
    new TextDisplayBuilder().setContent(description)
  );
}

export {buildNoticeContainer};
