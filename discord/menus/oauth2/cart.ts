import { cart } from "./manager-runtime.ts";

export async function openOAuth2Cart(interaction: any) {
  return cart.run(interaction, interaction.client);
}
