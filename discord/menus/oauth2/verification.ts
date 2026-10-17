import { rescue } from "./manager-runtime.ts";

export async function openOAuth2Verification(interaction: any) {
  return rescue.run(interaction, interaction.client);
}
