// @ts-nocheck
import type { IncomingMessage, ServerResponse } from "node:http";
import { MessageFlags } from "discord.js";
import { getOAuth2Config } from "../configs/config.ts";
import { buildOAuth2MemberLogContainer } from "../discord/menus/oauth2/member-log.ts";
import { registros, configuracoes, General, PullRequest, Licensa } from "../database/oauth2/index.ts";
import { generateToken } from "../discord/menus/oauth2/runtime/application.ts";

function json(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "Access-Control-Allow-Origin": "*" });
  res.end(JSON.stringify(body));
}

function authorized(req: IncomingMessage, url: URL) {
  const expected = getOAuth2Config().apiToken;
  if (!expected) return false;
  const header = String(req.headers.authorization || "");
  return header === expected || header === `Bearer ${expected}` || url.searchParams.get("token") === expected;
}

function clonePublic(record: any) {
  if (!record) return null;
  const output = structuredClone(record);
  delete output.token;
  delete output.client_secret;
  delete output.originbot;
  for (const user of output.usuarios || []) {
    if (user.access_token !== "unauthorized") delete user.access_token;
    delete user.refresh_token;
    delete user.ip;
    delete user.token_expires;
    delete user.serverid;
  }
  return output;
}

async function body(req: IncomingMessage) {
  let raw = "";
  for await (const chunk of req) raw += chunk;
  try { return JSON.parse(raw || "{}"); } catch { return {}; }
}

function browser(userAgent: string) {
  if (userAgent.includes("Chrome")) return "Chrome";
  if (userAgent.includes("Firefox")) return "Firefox";
  if (userAgent.includes("Safari")) return "Safari";
  if (userAgent.includes("Edge")) return "Edge";
  return "Outro";
}

async function managerLogin(req: IncomingMessage, res: ServerResponse, client: any, url: URL) {
  const stateValue = url.searchParams.get("state") || "";
  const parts = stateValue.split(" ");
  if (parts.length < 2) return false;

  const id = parts[0];
  const guildId = parts[1];
  const code = url.searchParams.get("code");
  const record = registros.get(id);
  if (!record) return json(res, 404, { message: "Bot não encontrado!", code: 404 }), true;
  if (!code) return json(res, 400, { message: "Código OAuth2 ausente.", code: 400 }), true;
  if (record.inativo) {
    res.writeHead(302, { Location: `https://discord.com/channels/${guildId}` });
    res.end();
    return true;
  }

  const form = new URLSearchParams({
    client_id: String(record.botid),
    client_secret: String(record.client_secret),
    grant_type: "authorization_code",
    code,
    redirect_uri: getOAuth2Config().redirectUri
  });
  const tokenResponse = await fetch("https://discord.com/api/v10/oauth2/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: form });
  if (!tokenResponse.ok) {
    res.writeHead(302, { Location: `https://discord.com/channels/${guildId}` });
    res.end();
    return true;
  }
  const token = await tokenResponse.json() as any;
  const userResponse = await fetch("https://discord.com/api/users/@me", { headers: { Authorization: `Bearer ${token.access_token}` } });
  if (!userResponse.ok) return json(res, 502, { message: "Não foi possível identificar o usuário.", code: 502 }), true;
  const user = await userResponse.json() as any;
  const guildsResponse = await fetch("https://discord.com/api/users/@me/guilds", { headers: { Authorization: `Bearer ${token.access_token}` } });
  const guilds = guildsResponse.ok ? await guildsResponse.json() as any[] : [];
  const guild = Array.isArray(guilds) ? guilds.find(item => item.id === guildId) : null;
  const guildInfo = guild || { id: guildId, name: "Servidor", icon: null };
  const ip = String(req.headers["x-forwarded-for"] || req.socket.remoteAddress || "").split(",")[0].trim();
  const expires = Date.now() + Number(token.expires_in || 604800) * 1000;
  const members = Array.isArray(record.usuarios) ? record.usuarios : [];
  const existing = members.find((item: any) => item.userid === user.id);
  const entry = existing || { userid: user.id, serverid: [] };
  entry.nome = user.username;
  entry.email = user.email;
  entry.access_token = token.access_token;
  entry.refresh_token = token.refresh_token;
  entry.token_expires = expires;
  entry.ip = ip;
  entry.timestamp = Date.now();
  entry.serverid = Array.isArray(entry.serverid) ? entry.serverid : [];
  if (!entry.serverid.some((item: any) => item.idserver === guildId)) entry.serverid.push({ idserver: guildId, servername: guildInfo.name });
  if (!existing) members.push(entry);
  registros.set(`${id}.usuarios`, members);

  const config = configuracoes.get(guildId);
  if (Array.isArray(config?.cargos) && config.cargos.length) {
    const memberResponse = await fetch(`https://discord.com/api/v10/guilds/${guildId}/members/${user.id}`, { headers: { Authorization: `Bot ${record.token}` } });
    if (memberResponse.ok) {
      const member = await memberResponse.json() as any;
      await fetch(`https://discord.com/api/v10/guilds/${guildId}/members/${user.id}`, { method: "PATCH", headers: { Authorization: `Bot ${record.token}`, "Content-Type": "application/json" }, body: JSON.stringify({ roles: [...new Set([...(member.roles || []), ...config.cargos])] }) });
    }
  }
  if (record.principalserver?.id) {
    await fetch(`https://discord.com/api/v10/guilds/${record.principalserver.id}/members/${user.id}`, { method: "PUT", headers: { Authorization: `Bot ${record.token}`, "Content-Type": "application/json" }, body: JSON.stringify({ access_token: token.access_token }) }).catch(() => {});
  }
  if (config?.webhook) {
    await fetch(config.webhook, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: `Usuário verificado: ${user.username} (${user.id}) · IP: ${ip} · Navegador: ${browser(String(req.headers["user-agent"] || ""))}` }) }).catch(() => {});
  }

  const safeName = String(guildInfo.name).replace(/[&<>"']/g, "");
  const returnUrl = `https://discord.com/channels/${encodeURIComponent(guildId)}`;
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
  res.end(`<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${safeName}</title><style>body{font-family:system-ui;background:#0b1020;color:#fff;display:grid;place-items:center;min-height:100vh}.card{padding:32px;border:1px solid #283455;border-radius:18px;background:#121a31;text-align:center}a{display:inline-block;margin-top:20px;padding:12px 18px;border-radius:10px;background:#5865f2;color:#fff;text-decoration:none}</style><main class="card"><h1>Verificação concluída</h1><p>Você foi autenticado com sucesso em <strong>${safeName}</strong>.</p><a href="${returnUrl}">Voltar para o Discord</a></main>`);
  return true;
}

export async function handleLegacyApi(req: IncomingMessage, res: ServerResponse, client: any, url: URL) {
  if (url.pathname === "/api/login" && req.method === "GET") return managerLogin(req, res, client, url);
  if (!url.pathname.startsWith("/api/")) return false;

  if (url.pathname === "/api/checktoken2" && req.method === "GET") {
    const token = url.searchParams.get("token");
    const item = Licensa.filter((entry: any) => entry.data?.token === token)[0];
    if (!item) return json(res, 404, { message: "Nenhum registro encontrado! (TOKEN INVALIDO)", code: 404 }), true;
    return json(res, 200, { registro: item.data.registro }), true;
  }
  if (url.pathname === "/api/checktoken" && req.method === "GET" && url.searchParams.has("token")) {
    const item = Licensa.filter((entry: any) => entry.data?.token === url.searchParams.get("token"))[0];
    const record = item ? registros.get(item.data.registro) : null;
    return record ? json(res, 200, clonePublic(record)) : json(res, 404, { message: "Nenhum registro encontrado! (TOKEN INVALIDO)", code: 404 }), true;
  }

  const protectedLegacyRoutes = new Set(["/api/request", "/api/get", "/api/update", "/api/neworder", "/api/canallog", "/api/registro"]);
  if (!protectedLegacyRoutes.has(url.pathname)) return false;
  if (!authorized(req, url)) return json(res, 401, { message: "401: Unauthorized", code: 0 }), true;
  if (url.pathname === "/api/request" && req.method === "GET") return json(res, 200, PullRequest.get(url.searchParams.get("pass") || "") || { code: 400 }), true;
  if (url.pathname === "/api/get" && req.method === "GET") {
    const record = registros.get(url.searchParams.get("license") || "");
    return record ? json(res, 200, clonePublic(record)) : json(res, 200, { code: 401 }), true;
  }
  if (url.pathname === "/api/update" && req.method === "POST") {
    const input = await body(req);
    if (input.status === 0 || input.status === 1) {
      registros.set(`${input.license}.token`, input.token);
      registros.set(`${input.license}.client_secret`, input.client_secret);
      if (input.status === 1) {
        registros.set(`${input.license}.botid`, input.botid);
        registros.set(`${input.license}.usuarios`, []);
      }
    }
    return json(res, 200, { code: 200 }), true;
  }
  if (url.pathname === "/api/neworder" && req.method === "POST") {
    const input = await body(req);
    const record = registros.get(input.license);
    if (!record) return json(res, 200, { code: 401 }), true;
    const memberCheck = await fetch(`https://discord.com/api/v10/guilds/${input.serverid}/members/${record.botid}`, { headers: { Authorization: `Bot ${record.token}` } });
    if (!memberCheck.ok) return json(res, 200, { code: 401, botid: record.botid }), true;
    const available = (record.usuarios || []).filter((user: any) => user.access_token !== "unauthorized");
    const quantity = input.qtd === undefined ? available.length : Number(input.qtd);
    const channel = await client.channels.fetch(General.get("channelLog")).catch(() => null) as any;
    const log = buildOAuth2MemberLogContainer({ userId: input.userid, serverId: input.serverid, quantity });
    const logMessage = channel ? await channel.send({ components: [log], flags: MessageFlags.IsComponentsV2 }) : null;
    const pass = generateToken();
    PullRequest.set(pass, { token: input.license, idnewserver: input.serverid, quantidade: quantity, qtdpuxados: 0, status: "Pendente", message: { user: input.userid }, messagelog: logMessage ? { id: logMessage.id, channel: logMessage.channel.id } : {} });
    return json(res, 200, { code: 201, totalpuxados: quantity, serverid: input.serverid, license: input.license, pass }), true;
  }
  if (url.pathname === "/api/canallog" && req.method === "POST") {
    const input = await body(req);
    if (!registros.get(input.license)) return json(res, 200, { code: 401 }), true;
    registros.set(`${input.license}.channellog`, input.channelid);
    return json(res, 200, { code: 201 }), true;
  }
  if (url.pathname === "/api/registro" && req.method === "POST") {
    const input = await body(req);
    const existing = registros.filter((entry: any) => entry.data?.token === input.token)[0];
    if (existing) {
      registros.set(`${existing.ID}.client_secret`, input.client_secret);
      registros.set(`${existing.ID}.originbot`, input.originbot);
      return json(res, 202, { code: 202, licenseid: existing.ID }), true;
    }
    const id = generateToken();
    registros.set(id, { adicionais: [], client_secret: input.client_secret, owner: [input.userid], token: input.token, timestamp: Date.now() + 157680000000, botid: input.botid, originbot: input.originbot, usuarios: [] });
    return json(res, 201, { code: 201, licenseid: id }), true;
  }
  return false;
}
