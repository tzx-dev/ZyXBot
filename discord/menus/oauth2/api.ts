import { members } from "./manager-runtime.ts";

export async function openOAuth2MemberPull(client: any) {
  return members.PullStartMembers(client);
}
