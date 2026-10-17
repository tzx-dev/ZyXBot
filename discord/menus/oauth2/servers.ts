// @ts-nocheck
import { servers } from "./manager-runtime.ts";

export async function openOAuth2Servers(interaction: any, page?: number) {
  return servers.gerenciarservidores(interaction.client, interaction, page);
}

export async function openOAuth2ServerConfiguration(interaction: any, serverId: string) {
  return servers.dentroservidor(interaction.client, interaction, true, serverId, "");
}
