import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { registros } from "../../../database/oauth2/index.ts";

export const data = new SlashCommandBuilder().setName("infoauth").setDescription("Consultar o ranking de aplicações OAuth2").setDefaultMemberPermissions(PermissionFlagsBits.Administrator);
export async function run(interaction: any) {
  const ranking = registros.fetchAll().map((entry: any) => ({ id: entry.ID, users: entry.data?.usuarios?.length || 0 })).sort((a: any, b: any) => b.users - a.users);
  const text = ranking.length ? ranking.map((item: any, index: number) => `${index + 1}. ${item.id}: ${item.users} usuário(s)`).join("\n") : "Nenhuma aplicação registrada.";
  return interaction.reply({ content: `**Ranking OAuth2**\n${text}`, ephemeral: true });
}
export default { data, name: "infoauth", description: "Consultar o ranking de aplicações OAuth2", run };
