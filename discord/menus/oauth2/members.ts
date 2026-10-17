import { members } from "./manager-runtime.ts";

export async function openOAuth2Members(interaction: any) {
  return members.PullStartMembers(interaction.client);
}

export async function refreshOAuth2Members(client: any) {
  return members.PullStartMembers(client);
}
