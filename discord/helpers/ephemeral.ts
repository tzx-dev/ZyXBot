// @ts-nocheck
import { Routes } from "discord.js";

const store = new Map();

function rememberEphemeral(userId, interaction) {
  store.set(String(userId), {
    applicationId: interaction.applicationId,
    token: interaction.token,
    channelId: interaction.channelId,
    expiresAt: Date.now() + 14 * 60 * 1000
  });
}

function getEphemeral(userId) {
  const entry = store.get(String(userId));
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(String(userId));
    return null;
  }
  return entry;
}

function clearEphemeral(userId) {
  store.delete(String(userId));
}

async function editEphemeralOriginal(client, userId, payload) {
  const entry = getEphemeral(userId);
  if (!entry) return false;

  try {
    const body = {
      ...payload,
      components: (payload.components || []).map(c =>
        c && typeof c.toJSON === "function" ? c.toJSON() : c
      )
    };
    await client.rest.patch(Routes.webhookMessage(entry.applicationId, entry.token, "@original"), {
      body
    });
    return true;
  } catch (err) {
    console.warn("[ephemeral] Falha ao editar original:", err.message || err);
    return false;
  }
}

export {rememberEphemeral,
  getEphemeral,
  clearEphemeral,
  editEphemeralOriginal};
