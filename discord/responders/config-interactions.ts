// @ts-nocheck
import { PermissionFlagsBits } from "discord.js";
import { cv2Payload } from "../helpers/components.ts";
import { getSettings, setSettings } from "../../functions/data.ts";
import { getOwnerId } from "../../functions/permissions.ts";
import {
  buildConfigPanelFromClient,
  buildCustomizePanelFromClient,
  buildLogsPanelFromClient,
  buildNameModal,
  buildIconModal,
  buildBannerModal
} from "../helpers/config-panel.ts";
import { buildNoticeContainer } from "../menus/quests/notice.ts";
import { openOAuth2ApplicationSelect } from "../menus/oauth2/application-select.ts";

const LOG_SELECT_MAP = {
  "cfg:logs:login": "login",
  "cfg:logs:running": "questsRunning",
  "cfg:logs:completed": "questsCompleted"
};

function isConfigAllowed(interaction, settings) {
  const ownerId = getOwnerId() || settings.ownerId || "";
  const panelUsers = Array.isArray(settings.panelUsers) ? settings.panelUsers : [];
  return (
    (ownerId && interaction.user.id === ownerId) ||
    panelUsers.includes(interaction.user.id) ||
    Boolean(interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild))
  );
}

async function deny(interaction) {
  const payload = cv2Payload(
    buildNoticeContainer("Sem permissão", "Apenas owner / panelUsers podem usar este painel."),
    { ephemeral: true }
  );
  if (interaction.replied || interaction.deferred) {
    await interaction.followUp(payload).catch(() => {});
  } else if (interaction.isModalSubmit?.()) {
    await interaction.reply(payload).catch(() => {});
  } else {
    await interaction.reply(payload).catch(() => {});
  }
}

async function fetchImageBuffer(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const contentType = res.headers.get("content-type") || "";
  if (!contentType.startsWith("image/")) {
    throw new Error("URL não aponta para uma imagem válida");
  }
  return Buffer.from(await res.arrayBuffer());
}

async function handleConfigButton(interaction) {
  const id = interaction.customId;
  if (!id?.startsWith("cfg:")) return false;

  const settings = await getSettings();
  if (!isConfigAllowed(interaction, settings)) {
    await deny(interaction);
    return true;
  }

  if (id === "cfg:customize") {
    await interaction.update(
      cv2Payload(await buildCustomizePanelFromClient(interaction.client))
    );
    return true;
  }

  if (id === "cfg:oauth2") {
    await openOAuth2ApplicationSelect(interaction);
    return true;
  }

  if (id === "cfg:logs") {
    await interaction.update(cv2Payload(await buildLogsPanelFromClient(interaction.client)));
    return true;
  }

  if (id === "cfg:back") {
    await interaction.update(
      cv2Payload(
        await buildConfigPanelFromClient(interaction.client, interaction.user.username)
      )
    );
    return true;
  }

  if (id === "cfg:customize:name") {
    await interaction.showModal(buildNameModal());
    return true;
  }

  if (id === "cfg:customize:icon") {
    await interaction.showModal(buildIconModal());
    return true;
  }

  if (id === "cfg:customize:banner") {
    await interaction.showModal(buildBannerModal());
    return true;
  }

  return false;
}

async function handleConfigSelect(interaction) {
  const id = interaction.customId;
  if (!id?.startsWith("cfg:")) return false;

  const settings = await getSettings();
  if (!isConfigAllowed(interaction, settings)) {
    await deny(interaction);
    return true;
  }

  if (!settings.logs) settings.logs = { login: null, questsRunning: null, questsCompleted: null };

  if (id === "cfg:logs:clear") {
    const key = interaction.values[0];
    if (key && Object.prototype.hasOwnProperty.call(settings.logs, key)) {
      settings.logs[key] = null;
      await setSettings(settings);
    }
    await interaction.update(cv2Payload(await buildLogsPanelFromClient(interaction.client)));
    return true;
  }

  const logKey = LOG_SELECT_MAP[id];
  if (logKey) {
    const channelId = interaction.values[0] || null;
    settings.logs[logKey] = channelId;
    await setSettings(settings);
    await interaction.update(cv2Payload(await buildLogsPanelFromClient(interaction.client)));
    return true;
  }

  return false;
}

async function handleConfigModal(interaction) {
  const id = interaction.customId;
  if (!id?.startsWith("cfg:customize:")) return false;

  const settings = await getSettings();
  if (!isConfigAllowed(interaction, settings)) {
    await deny(interaction);
    return true;
  }

  await interaction.deferReply({ ephemeral: true });

  try {
    if (id === "cfg:customize:name:modal") {
      const name = interaction.fields.getTextInputValue("name").trim();
      await interaction.client.user.setUsername(name);
      await interaction.editReply(
        cv2Payload(buildNoticeContainer("Nome atualizado", `\`✅\` Novo nome: **${name}**`))
      );
    } else if (id === "cfg:customize:icon:modal") {
      const url = interaction.fields.getTextInputValue("url").trim();
      const buffer = await fetchImageBuffer(url);
      await interaction.client.user.setAvatar(buffer);
      await interaction.editReply(
        cv2Payload(buildNoticeContainer("Ícone atualizado", "`✅` Avatar do bot alterado com sucesso."))
      );
    } else if (id === "cfg:customize:banner:modal") {
      const url = interaction.fields.getTextInputValue("url").trim();
      const buffer = await fetchImageBuffer(url);
      await interaction.client.user.setBanner(buffer);
      await interaction.editReply(
        cv2Payload(buildNoticeContainer("Banner atualizado", "`✅` Banner do bot alterado com sucesso."))
      );
    } else {
      return false;
    }

    // Atualiza o painel ephemeral de personalização, se ainda acessível
    if (interaction.message?.editable) {
      await interaction.message
        .edit(cv2Payload(await buildCustomizePanelFromClient(interaction.client)))
        .catch(() => {});
    }
  } catch (err) {
    await interaction.editReply(
      cv2Payload(
        buildNoticeContainer(
          "Falha ao personalizar",
          `Não foi possível aplicar a alteração.\n\`${String(err.message || err)}\``
        )
      )
    );
  }

  return true;
}

export {handleConfigButton,
  handleConfigSelect,
  handleConfigModal,
  isConfigAllowed};
