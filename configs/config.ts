import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export interface Config {
  BOT_TOKEN: string;
  DISCORD_CLIENT_ID: string;
  GUILD_ID?: string;
  DEPLOY_SCOPE?: "guild" | "global";
  AUTO_DEPLOY?: boolean;
  owners: string[];
  OAUTH2_REDIRECT_URI?: string;
  OAUTH2_PUBLIC_URL?: string;
  OAUTH2_PORT?: number;
  OAUTH2_API_TOKEN?: string;
  OAUTH2_ENCRYPTION_KEY?: string;
  OAUTH2_SCOPES?: string[];
}

const here = path.dirname(fileURLToPath(import.meta.url));
const configPath = path.join(here, "..", "config.json");
export const config = JSON.parse(fs.readFileSync(configPath, "utf8")) as Config;

export function getOAuth2Config() {
  const port = Number(process.env.NUBZ_OAUTH2_PORT || config.OAUTH2_PORT || 8080);
  const redirectUri = process.env.NUBZ_OAUTH2_REDIRECT_URI || config.OAUTH2_REDIRECT_URI || `http://localhost:${port}/api/login`;
  const publicUrl = process.env.NUBZ_OAUTH2_PUBLIC_URL || config.OAUTH2_PUBLIC_URL || redirectUri.replace(/\/api\/login\/?$/, "");
  const scopes = process.env.NUBZ_OAUTH2_SCOPES
    ? process.env.NUBZ_OAUTH2_SCOPES.split(/[ ,]+/).filter(Boolean)
    : config.OAUTH2_SCOPES?.length
      ? config.OAUTH2_SCOPES
      : ["identify", "email", "guilds.join"];

  return {
    port,
    host: process.env.NUBZ_OAUTH2_HOST || "0.0.0.0",
    redirectUri,
    publicUrl,
    apiToken: process.env.NUBZ_OAUTH2_API_TOKEN || config.OAUTH2_API_TOKEN || "",
    encryptionKey: process.env.NUBZ_OAUTH2_ENCRYPTION_KEY || config.OAUTH2_ENCRYPTION_KEY || "",
    scopes
  };
}

export default config;
