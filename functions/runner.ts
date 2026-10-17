// @ts-nocheck
import { cv2Payload } from "../discord/helpers/components.ts";
import { buildProgressPanel } from "../discord/menus/quests/progress.ts";
import { buildMainPanel } from "../discord/menus/quests/main.ts";
import {
  upsertQuestProgress,
  getUserProgress,
  setUserProgress,
  getActiveSessionCount,
  getStatusLabel,
  setRuntimeMessage,
  getRuntimeMessage,
  listResumableQuests
} from "./progress.ts";
import { countAccounts, getAccount, removeAccount } from "./accounts.ts";
import { getSettings } from "./data.ts";
import {
  fetchQuests,
  filterTodo,
  questId,
  getQuestName,
  getTaskTarget,
  getTaskProgress
} from "../discord/api/quests.ts";
import { runQuest } from "../discord/api/tasks.ts";
import { editEphemeralOriginal } from "../discord/helpers/ephemeral.ts";
import { logQuestRunning, logQuestCompleted } from "./logs.ts";
import { packageVersion } from "./version.ts";

const startedAtByUser = new Map();
const uiLocks = new Map();

async function refreshMainPanel(client) {
  try {
    const settings = await getSettings();
    const ref = settings.panelMessage;
    if (!ref?.channelId || !ref?.messageId) return;

    const channel = await client.channels.fetch(ref.channelId).catch(() => null);
    if (!channel?.isTextBased?.()) return;

    const message = await channel.messages.fetch(ref.messageId).catch(() => null);
    if (!message) return;

    await message.edit(
      cv2Payload(
        buildMainPanel({
          accounts: await countAccounts(),
          sessions: getActiveSessionCount(),
          status: getStatusLabel(),
          botVersion: settings.botVersion || packageVersion(),
          botAvatar: client.user?.displayAvatarURL?.({ size: 128 })
        })
      )
    );
  } catch (err) {
    console.warn("[panel] Falha ao atualizar painel:", err.message || err);
  }
}

async function buildProgressPayload(discordUserId) {
  const user = await getUserProgress(discordUserId);
  const quests = Object.entries(user.quests || {})
    .filter(([, q]) => ["running", "pending", "done", "error"].includes(q.status))
    .map(([id, q]) => ({ questId: id, ...q }))
    .sort((a, b) => String(a.startedAt || "").localeCompare(String(b.startedAt || "")));

  const startedAt = startedAtByUser.get(discordUserId) || Date.now();
  return cv2Payload(buildProgressPanel({ quests, startedAt }));
}

async function pushProgressUi(client, discordUserId) {
  if (uiLocks.get(discordUserId)) return;
  uiLocks.set(discordUserId, true);

  try {
    const payload = await buildProgressPayload(discordUserId);

    const edited = await editEphemeralOriginal(client, discordUserId, payload);
    if (edited) return;

    const runtimeMsg = getRuntimeMessage(discordUserId);
    if (runtimeMsg?.channelId && runtimeMsg?.messageId) {
      try {
        const channel = await client.channels.fetch(runtimeMsg.channelId);
        const message = await channel.messages.fetch(runtimeMsg.messageId);
        await message.edit(payload);
        return;
      } catch {
      }
    }

    try {
      const user = await client.users.fetch(discordUserId);
      const dm = await user.createDM();
      const msg = await dm.send(payload);
      const ref = { channelId: msg.channelId, messageId: msg.id };
      setRuntimeMessage(discordUserId, ref);
      await setUserProgress(discordUserId, { message: ref });
    } catch (err) {
      console.warn("[progress] Sem UI atualizável:", err.message || err);
    }
  } finally {
    uiLocks.set(discordUserId, false);
  }
}

async function startQuestsForUser(client, discordUserId, token, chosenQuests) {
  const startedAt = Date.now();
  startedAtByUser.set(discordUserId, startedAt);

  await setUserProgress(discordUserId, {
    startedAt,
    quests: {}
  });

  for (const quest of chosenQuests) {
    const qid = String(questId(quest));
    const label = getQuestName(quest);
    const secondsNeeded = getTaskTarget(quest);
    const secondsDone = getTaskProgress(quest);

    await upsertQuestProgress(discordUserId, qid, {
      status: "pending",
      label,
      secondsNeeded,
      secondsDone,
      elapsedSeconds: 0,
      startedAt: new Date().toISOString()
    });
  }

  await pushProgressUi(client, discordUserId);
  await refreshMainPanel(client);

  for (const quest of chosenQuests) {
    const qid = String(questId(quest));
    void runSingleQuest(client, discordUserId, token, quest, qid);
  }
}

async function runSingleQuest(client, discordUserId, token, quest, qid) {
  const started = Date.now();
  const label = getQuestName(quest);
  const account = await getAccount(discordUserId);
  const username = account?.username || account?.globalName || discordUserId;

  await upsertQuestProgress(discordUserId, qid, {
    status: "running",
    label,
    secondsNeeded: getTaskTarget(quest),
    secondsDone: getTaskProgress(quest)
  });
  await refreshMainPanel(client);

  void logQuestRunning(client, {
    discordUserId,
    username,
    questLabel: label,
    secondsNeeded: getTaskTarget(quest)
  });

  try {
    await runQuest(token, quest, async progress => {
      const elapsedSeconds = Math.floor((Date.now() - started) / 1000);
      await upsertQuestProgress(discordUserId, qid, {
        status: progress.status === "done" ? "done" : "running",
        label: progress.label || label,
        secondsDone: progress.secondsDone,
        secondsNeeded: progress.secondsNeeded,
        elapsedSeconds
      });
      await pushProgressUi(client, discordUserId);
    });

    const elapsedSeconds = Math.floor((Date.now() - started) / 1000);
    await upsertQuestProgress(discordUserId, qid, {
      status: "done",
      secondsDone: getTaskTarget(quest),
      secondsNeeded: getTaskTarget(quest),
      elapsedSeconds
    });

    void logQuestCompleted(client, {
      discordUserId,
      username,
      questLabel: label,
      elapsedSeconds,
      status: "done"
    });
  } catch (err) {
    const msg = String(err.message || err);
    const unauthorized = msg.includes("401") || /unauthorized|invalid/i.test(msg);
    const elapsedSeconds = Math.floor((Date.now() - started) / 1000);

    await upsertQuestProgress(discordUserId, qid, {
      status: "error",
      error: msg.slice(0, 120),
      elapsedSeconds
    });

    void logQuestCompleted(client, {
      discordUserId,
      username,
      questLabel: label,
      elapsedSeconds,
      status: "error",
      error: msg.slice(0, 120)
    });

    if (unauthorized) {
      await removeAccount(discordUserId);
      console.warn(`[progress] Token inválido para ${discordUserId}, conta removida.`);
    }
  }

  await pushProgressUi(client, discordUserId);
  await refreshMainPanel(client);
}

async function resumeSessions(client) {
  const resumable = await listResumableQuests();
  if (!resumable.length) {
    console.log("[progress] Nenhuma sessão para retomar.");
    return;
  }

  console.log(`[progress] Retomando ${resumable.length} quest(s)...`);

  const byUser = new Map();
  for (const item of resumable) {
    if (!byUser.has(item.userId)) byUser.set(item.userId, []);
    byUser.get(item.userId).push(item);
  }

  for (const [userId, items] of byUser.entries()) {
    const account = await getAccount(userId);
    if (!account?.token) {
      for (const item of items) {
        await upsertQuestProgress(userId, item.questId, {
          status: "error",
          error: "Token ausente após reinício"
        });
      }
      continue;
    }

    startedAtByUser.set(userId, Date.now());

    let quests;
    try {
      quests = filterTodo(await fetchQuests(account.token));
    } catch (err) {
      console.warn(`[progress] Falha ao buscar quests de ${userId}:`, err.message || err);
      if (String(err.message || err).includes("401")) {
        await removeAccount(userId);
      }
      continue;
    }

    const chosen = [];
    for (const item of items) {
      const q = quests.find(x => String(questId(x)) === String(item.questId));
      if (q) chosen.push(q);
      else {
        await upsertQuestProgress(userId, item.questId, {
          status: "done",
          error: null
        });
      }
    }

    if (!chosen.length) continue;

    if (!startedAtByUser.has(userId)) startedAtByUser.set(userId, Date.now());
    await pushProgressUi(client, userId);
    await refreshMainPanel(client);

    for (const quest of chosen) {
      const qid = String(questId(quest));
      void runSingleQuest(client, userId, account.token, quest, qid);
    }
  }
}

export {refreshMainPanel,
  pushProgressUi,
  startQuestsForUser,
  resumeSessions,
  buildProgressPayload};
