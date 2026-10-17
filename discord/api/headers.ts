// @ts-nocheck
import {
  USER_AGENT,
  ANDROID_USER_AGENT,
  desktopProperties,
  androidProperties
} from "./constants.ts";

function encodeProps(props) {
  return Buffer.from(JSON.stringify(props), "utf8").toString("base64");
}

function makeDesktopHeaders({ withProperties = true, withOrigin = true } = {}) {
  const headers = {
    "accept-language": "en-US",
    "User-Agent": USER_AGENT,
    pragma: "no-cache",
    priority: "u=1, i",
    "sec-ch-ua": '"Not)A;Brand";v="8", "Chromium";v="138"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"Windows"',
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin"
  };

  if (withOrigin) {
    headers.origin = "https://discord.com";
    headers.referer = "https://discord.com/channels/@me";
  }

  if (withProperties) {
    headers["x-super-properties"] = encodeProps(desktopProperties());
  }

  return headers;
}

function makeAndroidHeaders({ withProperties = true } = {}) {
  const headers = {
    "accept-language": "en-US",
    "User-Agent": ANDROID_USER_AGENT
  };

  if (withProperties) {
    headers["x-super-properties"] = encodeProps(androidProperties());
  }

  return headers;
}

function makeHeaders(initHeaders = {}) {
  const headers = { ...initHeaders };
  const isAndroid = headers.AndroidRequest === "true";
  delete headers.AndroidRequest;

  if (typeof headers.Authorization === "string" && headers.Authorization.startsWith("Bot ")) {
    headers.Authorization = headers.Authorization.slice(4);
  }

  headers["accept-language"] = "en-US";
  headers["x-debug-options"] = "bugReporterEnabled";
  headers["x-discord-locale"] = "en-US";
  headers["x-discord-timezone"] = "Asia/Saigon";

  Object.assign(headers, isAndroid ? makeAndroidHeaders() : makeDesktopHeaders());
  return headers;
}

function getActivityHeaders(questId, authToken = "", activityReferrer = "") {
  const headers = {
    "Content-Type": "application/json",
    "X-Auth-Token": authToken,
    "X-Discord-Quest-ID": questId
  };
  if (activityReferrer) headers.Referer = activityReferrer;
  return headers;
}

export {makeDesktopHeaders,
  makeAndroidHeaders,
  makeHeaders,
  getActivityHeaders};
