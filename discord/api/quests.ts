// @ts-nocheck
import { TASK_ORDER } from "./constants.ts";
import * as rest from "./rest.ts";

const REWARD_TYPE = {
  REWARD_CODE: 1,
  IN_GAME: 2,
  COLLECTIBLE: 3,
  VIRTUAL_CURRENCY: 4,
  FRACTIONAL_PREMIUM: 5
};

const FILTER_LABELS = {
  all: "Todas",
  orbs: "Orbs",
  decoration: "Decorações",
  in_game: "Itens em jogo"
};

function questId(quest) {
  return quest.id;
}

function questConfig(quest) {
  return quest.config;
}

function questUserStatus(quest) {
  return quest.user_status || {};
}

function questIsCompleted(quest) {
  return Boolean(questUserStatus(quest).completed_at);
}

function questIsEnrolled(quest) {
  return Boolean(questUserStatus(quest).enrolled_at);
}

function questIsExpired(quest) {
  const exp = questConfig(quest).expires_at;
  return Date.now() > new Date(exp).getTime();
}

function questUpdateStatus(quest, newStatus) {
  quest.user_status = newStatus;
}

function getRewardTypes(quest) {
  const rewards = questConfig(quest)?.rewards_config?.rewards || [];
  return new Set(rewards.map(r => r?.type).filter(t => t != null));
}

function getRewardName(quest) {
  const rewards = questConfig(quest)?.rewards_config?.rewards || [];
  return rewards[0]?.messages?.name || rewards[0]?.name || "Unknown";
}

function getTaskType(quest) {
  const tasks = questConfig(quest)?.task_config_v2?.tasks || {};
  return TASK_ORDER.find(t => t in tasks) || "UNKNOWN";
}

function getTaskTarget(quest) {
  const task = getTaskType(quest);
  return questConfig(quest)?.task_config_v2?.tasks?.[task]?.target || 0;
}

function getTaskProgress(quest) {
  const task = getTaskType(quest);
  return questUserStatus(quest)?.progress?.[task]?.value || 0;
}

function getTimeRemaining(quest) {
  const exp = questConfig(quest).expires_at;
  const diff = new Date(exp).getTime() - Date.now();
  if (diff <= 0) return "0d 0h";
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  return `${days}d ${hours}h`;
}

function getQuestName(quest) {
  return questConfig(quest)?.messages?.quest_name || "Quest";
}

async function fetchQuests(token) {
  const resp = await rest.get(token, "/quests/@me");
  if (resp?.quest_enrollment_blocked_until != null) {
    throw new Error(`Quest enrollment blocked until ${resp.quest_enrollment_blocked_until}`);
  }
  return resp?.quests || [];
}

function filterTodo(quests) {
  return quests.filter(q => !questIsCompleted(q) && !questIsExpired(q));
}

function filterByReward(quests, filter = "all") {
  if (!filter || filter === "all") return quests;
  if (filter === "orbs") {
    return quests.filter(q => getRewardTypes(q).has(REWARD_TYPE.VIRTUAL_CURRENCY));
  }
  if (filter === "decoration") {
    return quests.filter(q => getRewardTypes(q).has(REWARD_TYPE.COLLECTIBLE));
  }
  if (filter === "in_game") {
    return quests.filter(q => getRewardTypes(q).has(REWARD_TYPE.IN_GAME));
  }
  return quests;
}

async function acceptQuest(token, quest, isAndroid = false) {
  const body = {
    location: isAndroid ? 12 : 11,
    is_targeted: false,
    metadata_sealed: null,
    traffic_metadata_raw: quest.traffic_metadata_raw,
    traffic_metadata_sealed: quest.traffic_metadata_sealed
  };

  const resp = await rest.post(token, `/quests/${questId(quest)}/enroll`, body, {
    extraHeaders: { AndroidRequest: isAndroid ? "true" : "false" }
  });
  questUpdateStatus(quest, resp);
  return resp;
}

async function fetchUser(token) {
  return rest.get(token, "/users/@me");
}

async function fetchOrbsBalance(token) {
  try {
    const data = await rest.get(token, "/users/@me/virtual-currency/balance");
    if (data == null) return null;
    if (typeof data === "number") return data;
    if (typeof data.balance === "number") return data.balance;
    if (typeof data.orbs === "number") return data.orbs;
    if (typeof data.amount === "number") return data.amount;
    if (typeof data.user_balance === "number") return data.user_balance;
    if (typeof data?.balances?.[0]?.balance === "number") return data.balances[0].balance;
    return null;
  } catch {
    return null;
  }
}

async function validateToken(token) {
  try {
    const user = await fetchUser(token);
    return { ok: true, user };
  } catch (err) {
    return { ok: false, error: err };
  }
}

function avatarUrl(user) {
  if (!user?.id) return null;
  if (user.avatar) {
    const ext = user.avatar.startsWith("a_") ? "gif" : "png";
    return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${ext}?size=256`;
  }
  const idx = Number(BigInt(user.id) >> 22n) % 6;
  return `https://cdn.discordapp.com/embed/avatars/${idx}.png`;
}

function premiumLabel(premiumType) {
  if (premiumType === 1) return "Nitro Classic";
  if (premiumType === 2) return "Nitro";
  if (premiumType === 3) return "Nitro Basic";
  return "Sem Nitro";
}

export {REWARD_TYPE,
  FILTER_LABELS,
  questId,
  questConfig,
  questUserStatus,
  questIsCompleted,
  questIsEnrolled,
  questIsExpired,
  questUpdateStatus,
  getRewardTypes,
  getRewardName,
  getTaskType,
  getTaskTarget,
  getTaskProgress,
  getTimeRemaining,
  getQuestName,
  fetchQuests,
  filterTodo,
  filterByReward,
  acceptQuest,
  fetchUser,
  fetchOrbsBalance,
  validateToken,
  avatarUrl,
  premiumLabel};
