// @ts-nocheck
import { SlashCommandBuilder } from "discord.js";
import { registros } from "../../../database/oauth2/index.ts";
import { primeirapg } from "../../../discord/menus/oauth2/runtime/application.ts";

export const data = new SlashCommandBuilder().setName("auth").setDescription("Gerencie sua aplicação OAuth2").addStringOption(option => option.setName("aplicacao").setDescription("Aplicação registrada").setRequired(true).setAutocomplete(true));
export async function run(interaction: any) {
  const id = interaction.options.getString("aplicacao", true);
  if (id === "nada") return interaction.reply({ content: "❌ Nenhuma aplicação selecionada.", ephemeral: true });
  const record = registros.get(id);
  if (!record || !Array.isArray(record.owner) || !record.owner.includes(interaction.user.id)) return interaction.reply({ content: "❌ Aplicação não encontrada.", ephemeral: true });
  return primeirapg(interaction.client, interaction, null, id);
}
export async function autocomplete(interaction: any) {
  const records = registros.filter((entry: any) => entry.data?.owner?.includes(interaction.user.id));
  const results = records.slice(0, 25).map((entry: any) => ({ name: `🔖 ${entry.ID}`, value: String(entry.ID) }));
  return interaction.respond(results.length ? results : [{ name: "Nenhuma aplicação registrada", value: "nada" }]);
}
export default { data, name: "auth", description: "Gerencie sua aplicação OAuth2", run, autocomplete };
