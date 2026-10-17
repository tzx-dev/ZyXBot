// @ts-nocheck

const sessions = new Map();

function getActiveSessions() {
  let total = 0;
  for (const set of sessions.values()) total += set.size;
  return total;
}

function hasActiveSession(discordUserId) {
  const set = sessions.get(discordUserId);
  return Boolean(set && set.size > 0);
}

function startSession(discordUserId, questId) {
  if (!sessions.has(discordUserId)) sessions.set(discordUserId, new Set());
  sessions.get(discordUserId).add(questId);
}

function endSession(discordUserId, questId) {
  const set = sessions.get(discordUserId);
  if (!set) return;
  set.delete(questId);
  if (set.size === 0) sessions.delete(discordUserId);
}

function getStatusLabel() {
  const active = getActiveSessions();
  if (active > 0) return "Em execução";
  return "Aguardando início";
}

export {getActiveSessions,
  hasActiveSession,
  startSession,
  endSession,
  getStatusLabel};
