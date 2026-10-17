// @ts-nocheck
import { ContainerBuilder, TextDisplayBuilder } from "discord.js";

export function buildOAuth2MemberLogContainer({ userId, serverId, quantity, timestamp = Date.now() }) {
  return new ContainerBuilder().addTextDisplayComponents(new TextDisplayBuilder().setContent(`# Logs de Puxar Membros\nO usuário <@!${userId}> fez um pedido.\n\n**Servidor:** \`${serverId}\`\n**Membros:** \`0\`/\`${quantity}\`\n**Status:** \`Em andamento\`\n**Última atualização:** <t:${Math.floor(timestamp / 1000)}:R>`));
}
