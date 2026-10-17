import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import type { Client } from "discord.js";
import { getOAuth2Config } from "../configs/config.ts";
import { handleLegacyApi } from "./manager-http.ts";

function json(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*"
  });
  res.end(JSON.stringify(body));
}

async function route(req: IncomingMessage, res: ServerResponse, client: Client) {
  const url = new URL(req.url || "/", "http://localhost");
  if (req.method === "OPTIONS") {
    res.writeHead(204, { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "Authorization, Content-Type" });
    res.end();
    return;
  }
  if (url.pathname === "/" || url.pathname === "/health") {
    json(res, 200, { service: "NubZ OAuth2 Manager", ok: true, callback: getOAuth2Config().redirectUri });
    return;
  }
  if (await handleLegacyApi(req, res, client, url)) return;
  json(res, 404, { code: 404, message: "Rota não encontrada." });
}

export function startOAuth2Server(client: Client) {
  const settings = getOAuth2Config();
  const server = createServer((req, res) => {
    void route(req, res, client).catch(error => {
      console.error("[nubz-manager] erro HTTP:", error);
      if (!res.headersSent) json(res, 500, { code: 500, message: "Erro interno do NubZ OAuth2 Manager." });
      else res.end();
    });
  });
  server.listen(settings.port, settings.host, () => {
    console.log(`✓ NubZ OAuth2 Manager HTTP em ${settings.host}:${settings.port}`);
    console.log(`✓ Callback do manager: ${settings.redirectUri}`);
  });
  return server;
}
