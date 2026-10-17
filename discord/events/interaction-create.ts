// @ts-nocheck
import type { ClientEvents } from "discord.js";
import { commands } from "../commands.ts";
import { handleButton, handleSelect, handleModal } from "../responders/interactions.ts";
import { handleOAuth2Manager } from "../responders/oauth2/manager.ts";

export const name: keyof ClientEvents = "interactionCreate";
export async function run(interaction: ClientEvents["interactionCreate"][0]) {
  try {
    if (interaction.isChatInputCommand()) {
      const command = commands.find(item => item.name === interaction.commandName);
      if (command) await command.run(interaction);
      return;
    }
    if (interaction.isAutocomplete()) {
      const command = commands.find(item => item.name === interaction.commandName) as any;
      if (command?.autocomplete) await command.autocomplete(interaction);
      return;
    }
    if (interaction.isButton()) {
      if (!(await handleButton(interaction))) await handleOAuth2Manager(interaction);
      return;
    }
    if (interaction.isStringSelectMenu() || interaction.isChannelSelectMenu()) {
      if (!(await handleSelect(interaction))) await handleOAuth2Manager(interaction);
      return;
    }
    if (interaction.isModalSubmit()) {
      if (!(await handleModal(interaction))) await handleOAuth2Manager(interaction);
    }
  } catch (error) {
    console.error(`[interaction] Erro em ${interaction.customId || interaction.commandName}:`, error);
    const reply = { content: "Ocorreu um erro ao processar esta interação.", ephemeral: true };
    if (interaction.replied || interaction.deferred) await interaction.followUp(reply).catch(() => {});
    else await interaction.reply(reply).catch(() => {});
  }
}
export default { name, run };
