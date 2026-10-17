import { auth } from "./manager-runtime.ts";

export async function openOAuth2Application(interaction: any, applicationId: string) {
  return auth.primeirapg(interaction.client, interaction, null, applicationId);
}
