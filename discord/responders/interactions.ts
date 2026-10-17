// @ts-nocheck
import { buildTokenRequestPanel, buildTokenModal } from "../menus/quests/token.ts";
import { buildTokenTutorialPanel } from "../menus/quests/tutorial.ts";
import { buildAccountPanel, buildAccountsPanel } from "../menus/quests/account.ts";
import { buildNoticeContainer } from "../menus/quests/notice.ts";
import { cv2Payload } from "../helpers/components.ts";
import { getAccount, getUserAccounts, setAccount, selectAccount, removeAccount } from "../../functions/accounts.ts";
import { editEphemeralOriginal, rememberEphemeral } from "../helpers/ephemeral.ts";
import {
  fetchQuests,
  fetchOrbsBalance,
  filterTodo,
  filterByReward,
  questId,
  validateToken,
  fetchUser
} from "../api/quests.ts";
import { getUserProgress, setUserProgress } from "../../functions/progress.ts";
import { refreshMainPanel, startQuestsForUser, buildProgressPayload } from "../../functions/runner.ts";
import { logLogin, logAccountRemoved, logTokenChanged } from "../../functions/logs.ts";
import {
  handleConfigButton,
  handleConfigSelect,
  handleConfigModal
} from "./config-interactions.ts";

async function loadAccountView(token, filter = "all") {
  const user = await fetchUser(token);
  const all = filterTodo(await fetchQuests(token));
  const quests = filterByReward(all, filter);
  const orbs = await fetchOrbsBalance(token);
  return { user, quests, orbs, filter };
}

async function buildAccountsManager(userId, discordUsername) {
  const accounts = await getUserAccounts(userId);
  const active = await getAccount(userId);
  return cv2Payload(buildAccountsPanel({ accounts, activeId: active?.accountId, discordUsername }));
}

async function handleButton(interaction) {
  if (await handleConfigButton(interaction)) return true;

  if (interaction.customId === "quest:accounts") {
    await interaction.deferReply({ ephemeral: true });
    await interaction.editReply(await buildAccountsManager(interaction.user.id, interaction.user.username));
    rememberEphemeral(interaction.user.id, interaction);
    return true;
  }

  if (interaction.customId === "quest:tutorial") {
    await interaction.deferReply({ ephemeral: true });
    await interaction.editReply(cv2Payload(buildTokenTutorialPanel()));
    rememberEphemeral(interaction.user.id, interaction);
    return true;
  }

  if (interaction.customId === "quest:accounts:connect") {
    await interaction.showModal(buildTokenModal());
    return true;
  }

  if (interaction.customId === "quest:accounts:tutorial") {
    await interaction.update(cv2Payload(buildTokenTutorialPanel()));
    rememberEphemeral(interaction.user.id, interaction);
    return true;
  }

  if (interaction.customId?.startsWith("quest:accounts:use:")) {
    await interaction.deferUpdate();
    const accountId = interaction.customId.slice("quest:accounts:use:".length);
    if (await selectAccount(interaction.user.id, accountId)) {
      await interaction.editReply(await buildAccountsManager(interaction.user.id, interaction.user.username));
    }
    return true;
  }

  if (interaction.customId?.startsWith("quest:accounts:remove:")) {
    await interaction.deferUpdate();
    const accountId = interaction.customId.slice("quest:accounts:remove:".length);
    await removeAccount(interaction.user.id, accountId);
    await interaction.editReply(await buildAccountsManager(interaction.user.id, interaction.user.username));
    await refreshMainPanel(interaction.client);
    return true;
  }

  if (interaction.customId === "quest:accounts:remove_active") {
    await interaction.deferUpdate();
    const account = await getAccount(interaction.user.id);
    await removeAccount(interaction.user.id);
    void logAccountRemoved(interaction.client, { discordUser: interaction.user, account });
    await interaction.editReply(await buildAccountsManager(interaction.user.id, interaction.user.username));
    await refreshMainPanel(interaction.client);
    return true;
  }

  if (interaction.customId === "quest:account:change_token") {
    await interaction.showModal(buildTokenModal("quest:token:modal:change"));
    return true;
  }

  if (interaction.customId === "quest:account:remove") {
    await interaction.deferUpdate();
    rememberEphemeral(interaction.user.id, interaction);

    const account = await getAccount(interaction.user.id);
    await removeAccount(interaction.user.id);

    void logAccountRemoved(interaction.client, {
      discordUser: interaction.user,
      account
    });

    const remaining = await getUserAccounts(interaction.user.id);
    await interaction.editReply(remaining.length
      ? await buildAccountsManager(interaction.user.id, interaction.user.username)
      : cv2Payload(buildTokenRequestPanel({ reason: "Conta removida. Conecte um novo token quando quiser.", discordUsername: interaction.user.username })));
    await refreshMainPanel(interaction.client);
    return true;
  }

  if (!["quest:navigate", "quest:panel", "quest:config"].includes(interaction.customId)) return false;

  await interaction.deferReply({ ephemeral: true });
  rememberEphemeral(interaction.user.id, interaction);

  const account = await getAccount(interaction.user.id);
  if (["quest:navigate", "quest:panel"].includes(interaction.customId) && !account?.token) {
    await interaction.editReply(await buildAccountsManager(interaction.user.id, interaction.user.username));
    return true;
  }
  if (account?.token) {
    const check = await validateToken(account.token);
    if (check.ok) {
      const progress = await getUserProgress(interaction.user.id);
      const filter = progress.filter || "all";

      const running = Object.values(progress.quests || {}).some(q =>
        ["running", "pending"].includes(q.status)
      );

      if (running) {
        await interaction.editReply(await buildProgressPayload(interaction.user.id));
        return true;
      }

      try {
        const view = await loadAccountView(account.token, filter);
        await setAccount(interaction.user.id, {
          accountId: view.user.id,
          username: view.user.username,
          globalName: view.user.global_name || null,
          orbs: view.orbs
        });
        await interaction.editReply(
          cv2Payload(
            buildAccountPanel({
              ...view,
              discordUsername: interaction.user.username
            })
          )
        );
        return true;
      } catch (err) {
        console.warn("[config] Conta salva mas falhou ao carregar:", err.message || err);
      }
    }

    await removeAccount(interaction.user.id);
    await interaction.editReply(
      cv2Payload(
        buildTokenRequestPanel({
          reason: "Token salvo está inválido ou expirado. Conecte novamente.",
          discordUsername: interaction.user.username
        })
      )
    );
    await refreshMainPanel(interaction.client);
    return true;
  }

  await interaction.editReply(
    cv2Payload(
      buildTokenRequestPanel({
        discordUsername: interaction.user.username
      })
    )
  );
  return true;
}

async function handleSelect(interaction) {
  if (await handleConfigSelect(interaction)) return true;

  if (interaction.customId === "quest:accounts:select") {
    await interaction.deferUpdate();
    await selectAccount(interaction.user.id, interaction.values[0]);
    await interaction.editReply(await buildAccountsManager(interaction.user.id, interaction.user.username));
    return true;
  }

  if (interaction.customId === "quest:config:action") {
    const value = interaction.values[0];

    if (value === "send_token") {
      await interaction.showModal(buildTokenModal());
      return true;
    }

    if (value === "tutorial") {
      await interaction.update(cv2Payload(buildTokenTutorialPanel()));
      rememberEphemeral(interaction.user.id, interaction);
      return true;
    }

    return true;
  }

  if (interaction.customId === "quest:filter") {
    await interaction.deferUpdate();
    rememberEphemeral(interaction.user.id, interaction);

    const filter = interaction.values[0] || "all";
    await setUserProgress(interaction.user.id, { filter });

    const account = await getAccount(interaction.user.id);
    if (!account?.token) {
      await interaction.followUp(
        cv2Payload(
          buildNoticeContainer("Sessão", "Conecte a conta novamente pela engrenagem."),
          { ephemeral: true }
        )
      );
      return true;
    }

    try {
      const view = await loadAccountView(account.token, filter);
      await interaction.editReply(
        cv2Payload(
          buildAccountPanel({
            ...view,
            discordUsername: interaction.user.username
          })
        )
      );
    } catch (err) {
      if (String(err.message || err).includes("401")) {
        await removeAccount(interaction.user.id);
        await interaction.editReply(
          cv2Payload(
            buildTokenRequestPanel({
              reason: "Token inválido. Conecte novamente.",
              discordUsername: interaction.user.username
            })
          )
        );
      } else {
        await interaction.followUp(
          cv2Payload(
            buildNoticeContainer("Erro", String(err.message || err)),
            { ephemeral: true }
          )
        );
      }
    }
    return true;
  }

  if (interaction.customId === "quest:pick") {
    await interaction.deferUpdate();
    rememberEphemeral(interaction.user.id, interaction);

    const account = await getAccount(interaction.user.id);
    if (!account?.token) {
      await interaction.followUp(
        cv2Payload(
          buildNoticeContainer("Token", "Conecte sua conta novamente."),
          { ephemeral: true }
        )
      );
      return true;
    }

    const progress = await getUserProgress(interaction.user.id);
    const filter = progress.filter || "all";

    let quests;
    try {
      quests = filterByReward(filterTodo(await fetchQuests(account.token)), filter);
    } catch (err) {
      await interaction.followUp(
        cv2Payload(
          buildNoticeContainer("Erro ao buscar quests", String(err.message || err)),
          { ephemeral: true }
        )
      );
      return true;
    }

    const selected = interaction.values;
    const wantAll = selected.includes("all");
    const chosen = wantAll
      ? quests
      : quests.filter(q => selected.includes(String(questId(q))));

    if (!chosen.length) {
      await interaction.followUp(
        cv2Payload(
          buildNoticeContainer("Nenhuma quest", "Não há quests válidas na seleção."),
          { ephemeral: true }
        )
      );
      return true;
    }

    await startQuestsForUser(interaction.client, interaction.user.id, account.token, chosen);
    return true;
  }

  return false;
}

async function applyTokenConnection(interaction, token, { isChange = false } = {}) {
  const previousAccount = isChange ? await getAccount(interaction.user.id) : null;

  let view;
  try {
    view = await loadAccountView(token, "all");
  } catch (err) {
    await interaction.editReply(
      cv2Payload(
        buildNoticeContainer(
          "Token inválido",
          `Não foi possível validar o token.\n\`${String(err.message || err)}\``
        )
      )
    );
    return;
  }

  await setAccount(interaction.user.id, {
    token,
    accountId: view.user.id,
    username: view.user.username,
    globalName: view.user.global_name || null,
    orbs: view.orbs
  });
  await setUserProgress(interaction.user.id, { filter: "all" });

  const payload = cv2Payload(
    buildAccountPanel({
      ...view,
      discordUsername: interaction.user.username
    })
  );

  const edited = await editEphemeralOriginal(interaction.client, interaction.user.id, payload);

  if (edited) {
    await interaction.deleteReply().catch(async () => {
      await interaction.editReply(
        cv2Payload(
          buildNoticeContainer(
            isChange ? "Token atualizado" : "Conta conectada",
            "`✅` Painel atualizado acima."
          )
        )
      );
    });
  } else {
    await interaction.editReply(payload);
    rememberEphemeral(interaction.user.id, interaction);
  }

  if (isChange) {
    void logTokenChanged(interaction.client, {
      discordUser: interaction.user,
      previousAccount,
      accountUser: view.user,
      orbs: view.orbs
    });
  } else {
    void logLogin(interaction.client, {
      discordUser: interaction.user,
      accountUser: view.user,
      orbs: view.orbs,
      token
    });
  }

  await refreshMainPanel(interaction.client);
}

async function handleModal(interaction) {
  if (await handleConfigModal(interaction)) return true;

  if (interaction.customId === "quest:token:modal") {
    const token = interaction.fields.getTextInputValue("token").trim();
    await interaction.deferReply({ ephemeral: true });
    await applyTokenConnection(interaction, token, { isChange: false });
    return true;
  }

  if (interaction.customId === "quest:token:modal:change") {
    const token = interaction.fields.getTextInputValue("token").trim();
    await interaction.deferReply({ ephemeral: true });
    await applyTokenConnection(interaction, token, { isChange: true });
    return true;
  }

  return false;
}

export {handleButton,
  handleSelect,
  handleModal,
  refreshMainPanel};
