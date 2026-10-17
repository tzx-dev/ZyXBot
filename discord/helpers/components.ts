// @ts-nocheck
import {
  MessageFlags
} from "discord.js";

const CV2_FLAGS = MessageFlags.IsComponentsV2;

const CV2_EPHEMERAL = MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral;

/**
 * Cria um payload pronto para enviar com Components V2.
 * @param {import("discord.js").ContainerBuilder|import("discord.js").TextDisplayBuilder|import("discord.js").SectionBuilder} component
 * @param {{ ephemeral?: boolean, files?: import("discord.js").AttachmentBuilder[] }} [options]
 */
function cv2Payload(component, options = {}) {
  const components = Array.isArray(component) ? component : [component];
  const flags = options.ephemeral ? CV2_EPHEMERAL : CV2_FLAGS;
  const payload = { components, flags };
  if (options.files?.length) payload.files = options.files;
  return payload;
}

function buildInteractionContext(interaction) {
  return {
    user: interaction.user.toString(),
    userAvatar: interaction.user.displayAvatarURL({ size: 256 }),
    botAvatar: interaction.client.user?.displayAvatarURL({ size: 256 }),
    guildName: interaction.guild?.name || "DM"
  };
}

export {CV2_FLAGS,
  CV2_EPHEMERAL,
  cv2Payload,
  buildInteractionContext};
