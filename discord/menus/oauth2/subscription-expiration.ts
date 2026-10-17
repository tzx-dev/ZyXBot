// @ts-nocheck
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ContainerBuilder, TextDisplayBuilder } from "discord.js";

export function buildOAuth2SubscriptionExpirationContainer({ desc, nome, timestamp }: { desc: string; nome: string; timestamp: number }) {
  return new ContainerBuilder().addTextDisplayComponents(new TextDisplayBuilder().setContent(`## Expiração de Assinatura\n\n${desc}\n\n**${nome}**\n- <t:${Math.floor(timestamp / 1000)}:F> (<t:${Math.floor(timestamp / 1000)}:R>)\n\n**Importante:**\n- Clique no botão abaixo para ser direcionado ao servidor e execute o comando \`/auth\` para concluir a verificação/renovação.\n- Se sua assinatura expirar, seu bot será inativado.`)).addActionRowComponents(new ActionRowBuilder().addComponents(new ButtonBuilder().setURL("https://discord.com/channels/1228128478147383367/1232780886555099258").setLabel("Ir para o servidor").setStyle(ButtonStyle.Link)));
}
