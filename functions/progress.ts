// @ts-nocheck
import * as fs from "fs/promises";
import * as path from "node:path";
import { randomBytes } from "crypto";
import { withFileLock } from "./store.ts";
import { databasePath } from "./paths.ts";

const progressFile = databasePath("progress.json");

const runtime = new Map();
let cache = null;

function emptyUserProgress() {
  return {
    quests: {},
    filter: "all",
    message: null,
    updatedAt: new Date().toISOString()
  };
}

async function readJsonUnlocked() {
  try {
    const content = await fs.readFile(progressFile, "utf8");
    return JSON.parse(content);
  } catch {
    return { users: {} };
  }
}

async function writeJsonUnlocked(data) {
  await fs.mkdir(path.dirname(progressFile), { recursive: true });
  const tmp = path.join(
    path.dirname(progressFile),
    `.progress.json.${process.pid}.${Date.now()}.${randomBytes(4).toString("hex")}.tmp`
  );
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), "utf8");
  try {
    await fs.rm(progressFile, { force: true });
    await fs.rename(tmp, progressFile);
  } catch {
    await fs.copyFile(tmp, progressFile);
    await fs.unlink(tmp).catch(() => {});
  }
}

async function ensureCache() {
  if (!cache) {
    cache = await readJsonUnlocked();
    if (!cache.users) cache.users = {};
  }
  return cache;
}

async function readProgress() {
  return withFileLock(progressFile, async () => {
    const data = await ensureCache();
    return structuredClone(data);
  });
}

async function mutateProgress(mutator) {
  return withFileLock(progressFile, async () => {
    const data = await ensureCache();
    if (!data.users) data.users = {};
    const result = await mutator(data);
    await writeJsonUnlocked(data);
    return result;
  });
}

async function loadProgressFile() {
  return readProgress();
}

async function getUserProgress(discordUserId) {
  const data = await readProgress();
  return data.users?.[discordUserId] || emptyUserProgress();
}

async function setUserProgress(discordUserId, patch) {
  return mutateProgress(data => {
    const prev = data.users[discordUserId] || emptyUserProgress();
    data.users[discordUserId] = {
      ...prev,
      ...patch,
      quests: patch.quests !== undefined ? patch.quests : prev.quests,
      updatedAt: new Date().toISOString()
    };

    if (!runtime.has(discordUserId)) runtime.set(discordUserId, { quests: {} });
    Object.assign(runtime.get(discordUserId), {
      quests: { ...data.users[discordUserId].quests },
      filter: data.users[discordUserId].filter,
      message: data.users[discordUserId].message
    });

    return structuredClone(data.users[discordUserId]);
  });
}

async function upsertQuestProgress(discordUserId, questId, questPatch) {
  return mutateProgress(data => {
    if (!data.users[discordUserId]) data.users[discordUserId] = emptyUserProgress();
    const user = data.users[discordUserId];
    user.quests[questId] = {
      ...(user.quests[questId] || {}),
      ...questPatch,
      updatedAt: new Date().toISOString()
    };
    user.updatedAt = new Date().toISOString();

    if (!runtime.has(discordUserId)) runtime.set(discordUserId, { quests: {} });
    runtime.get(discordUserId).quests[questId] = { ...user.quests[questId] };

    return structuredClone(user.quests[questId]);
  });
}

async function listResumableQuests() {
  const data = await readProgress();
  const out = [];
  for (const [userId, user] of Object.entries(data.users || {})) {
    for (const [questId, q] of Object.entries(user.quests || {})) {
      if (q.status === "running" || q.status === "pending") {
        out.push({ userId, questId, ...q });
      }
    }
  }
  return out;
}

function getActiveSessionCount() {
  let total = 0;
  for (const user of runtime.values()) {
    for (const q of Object.values(user.quests || {})) {
      if (q.status === "running") total += 1;
    }
  }
  return total;
}

function getStatusLabel() {
  return getActiveSessionCount() > 0 ? "Em execução" : "Aguardando início";
}

function getRuntimeUser(discordUserId) {
  return runtime.get(discordUserId) || null;
}

function setRuntimeMessage(discordUserId, messageRef) {
  if (!runtime.has(discordUserId)) runtime.set(discordUserId, { quests: {} });
  runtime.get(discordUserId).message = messageRef;
}

function getRuntimeMessage(discordUserId) {
  return runtime.get(discordUserId)?.message || null;
}

async function hydrateRuntimeFromDisk() {
  const data = await readProgress();
  for (const [userId, user] of Object.entries(data.users || {})) {
    runtime.set(userId, {
      quests: { ...(user.quests || {}) },
      message: user.message || null,
      filter: user.filter || "all"
    });
  }
}

export {loadProgressFile,
  getUserProgress,
  setUserProgress,
  upsertQuestProgress,
  listResumableQuests,
  getActiveSessionCount,
  getStatusLabel,
  getRuntimeUser,
  setRuntimeMessage,
  getRuntimeMessage,
  hydrateRuntimeFromDisk};
