// @ts-nocheck
import { readJson, writeJson } from "./store.ts";
import * as defaults from "./defaults.ts";
import { databasePath } from "./paths.ts";

const settingsFile = databasePath("settings.json");

function mergeDeep(base, value) {
  if (Array.isArray(base)) return Array.isArray(value) ? value : base;
  if (base && typeof base === "object") {
    if (!value || typeof value !== "object") return { ...base };
    const result = { ...base };
    for (const [key, val] of Object.entries(value)) {
      result[key] = mergeDeep(base[key], val);
    }
    return result;
  }
  return value === undefined ? base : value;
}

async function getSettings() {
  const data = await readJson(settingsFile, defaults.settings);
  return mergeDeep(defaults.settings, data);
}

async function setSettings(data) {
  return writeJson(settingsFile, data);
}

export {getSettings, setSettings};
