// @ts-nocheck
import { randomUUID } from "node:crypto";
import { readJson, writeJson } from "./store.ts";
import { databasePath } from "./paths.ts";

const accountsFile = databasePath("accounts.json");

function emptyUser() { return { activeId: null, accounts: {}, updatedAt: new Date().toISOString() }; }
function normalizeUser(value) {
  if (!value) return emptyUser();
  if (value.accounts && typeof value.accounts === "object") return { ...emptyUser(), ...value, accounts: { ...value.accounts } };
  if (value.token && value.accountId) return { activeId: String(value.accountId), accounts: { [String(value.accountId)]: { ...value } }, updatedAt: value.updatedAt || new Date().toISOString() };
  return emptyUser();
}
async function getAccounts() { return readJson(accountsFile, { users: {} }); }
async function saveAccounts(data) { return writeJson(accountsFile, data); }
async function getUserAccounts(discordUserId) {
  const data = await getAccounts();
  const user = normalizeUser(data.users?.[discordUserId]);
  return Object.values(user.accounts || {});
}
async function countAccounts() {
  const data = await getAccounts();
  return Object.values(data.users || {}).reduce((total, value) => total + Object.keys(normalizeUser(value).accounts || {}).length, 0);
}
async function getAccount(discordUserId, accountId = null) {
  const data = await getAccounts();
  const user = normalizeUser(data.users?.[discordUserId]);
  const id = accountId || user.activeId;
  return id ? user.accounts?.[String(id)] || null : null;
}
async function setAccount(discordUserId, account) {
  const data = await getAccounts();
  if (!data.users) data.users = {};
  const user = normalizeUser(data.users[discordUserId]);
  const id = String(account.accountId || account.id || user.activeId || randomUUID());
  user.accounts[id] = { ...user.accounts[id], ...account, accountId: id, updatedAt: new Date().toISOString() };
  user.activeId = id;
  user.updatedAt = new Date().toISOString();
  data.users[discordUserId] = user;
  await saveAccounts(data);
  return user.accounts[id];
}
async function selectAccount(discordUserId, accountId) {
  const data = await getAccounts();
  const user = normalizeUser(data.users?.[discordUserId]);
  if (!user.accounts?.[String(accountId)]) return null;
  user.activeId = String(accountId);
  user.updatedAt = new Date().toISOString();
  data.users[discordUserId] = user;
  await saveAccounts(data);
  return user.accounts[user.activeId];
}
async function removeAccount(discordUserId, accountId = null) {
  const data = await getAccounts();
  const user = normalizeUser(data.users?.[discordUserId]);
  const id = String(accountId || user.activeId || "");
  if (!id || !user.accounts?.[id]) return false;
  delete user.accounts[id];
  const remaining = Object.keys(user.accounts);
  user.activeId = remaining[0] || null;
  user.updatedAt = new Date().toISOString();
  data.users[discordUserId] = user;
  await saveAccounts(data);
  return true;
}
export { getAccounts, getUserAccounts, countAccounts, getAccount, setAccount, selectAccount, removeAccount };
