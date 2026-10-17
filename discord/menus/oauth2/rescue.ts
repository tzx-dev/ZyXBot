import { rescue } from "./manager-runtime.ts";

export async function openOAuth2Rescue(interaction: any) {
  return rescue.run(interaction, interaction.client);
}
