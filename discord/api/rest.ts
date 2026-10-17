// @ts-nocheck
import { DISCORD_API, USER_AGENT } from "./constants.ts";
import { makeHeaders } from "./headers.ts";

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function request(token, method, path, { body, extraHeaders, query } = {}) {
  const headers = makeHeaders({
    Authorization: token,
    ...(extraHeaders || {})
  });

  let url = DISCORD_API + path;
  if (query && Object.keys(query).length) {
    const params = new URLSearchParams(query);
    url += `?${params.toString()}`;
  }

  const res = await fetch(url, {
    method,
    headers: {
      ...headers,
      "User-Agent": headers["User-Agent"] || USER_AGENT,
      ...(body !== undefined ? { "Content-Type": "application/json" } : {})
    },
    body: body !== undefined ? JSON.stringify(body) : undefined
  });

  if (res.status === 429) {
    const retryAfter = Number(res.headers.get("Retry-After") || 1);
    console.warn(`[discord-api] Rate limited. Retrying in ${retryAfter}s`);
    await sleep(retryAfter * 1000);
    return request(token, method, path, { body, extraHeaders, query });
  }

  if (res.status === 204) return null;

  const text = await res.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    const msg = typeof data === "object" && data?.message ? data.message : text || res.statusText;
    const err = new Error(`Discord API ${res.status}: ${msg}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

function get(token, path, options = {}) {
  return request(token, "GET", path, options);
}

function post(token, path, body, options = {}) {
  return request(token, "POST", path, { ...options, body });
}

function del(token, path, options = {}) {
  return request(token, "DELETE", path, options);
}

export {request, get, post, del};
