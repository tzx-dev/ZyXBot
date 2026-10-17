// @ts-nocheck
import { config } from "../configs/config.ts";

function getOwnerId() {
  return config.owners?.[0] || "";
}

async function requireOwner(interaction) {
  const ownerId = getOwnerId();
  if (!ownerId) {
    await interaction.reply({ content: "Nenhum owner configurado no config.json.", ephemeral: true });
    return null;
  }
  if (interaction.user.id !== ownerId) {
    await interaction.reply({ content: "Sem permissão para executar esta ação.", ephemeral: true });
    return null;
  }
  return true;
}

export {requireOwner, getOwnerId};
