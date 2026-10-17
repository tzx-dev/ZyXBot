import { members } from "./manager-runtime.ts";

export async function openOAuth2Logs(client: any) {
  return members.PullStartMembers(client);
}
