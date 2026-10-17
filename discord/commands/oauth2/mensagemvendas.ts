import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { mensagemvendas } from "../../../functions/oauth2/sales.ts";

export const data = new SlashCommandBuilder().setName("mensagemvendas").setDescription("Enviar ou atualizar a mensagem pública de vendas OAuth2").setDefaultMemberPermissions(PermissionFlagsBits.Administrator);
export async function run(interaction: any) {
  return mensagemvendas(interaction.client, interaction, null);
}
export default { data, name: "mensagemvendas", description: "Enviar ou atualizar a mensagem pública de vendas OAuth2", run };
