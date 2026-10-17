// @ts-nocheck
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ContainerBuilder, SectionBuilder, SeparatorBuilder, StringSelectMenuBuilder, TextDisplayBuilder, ThumbnailBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from "discord.js";
import { getQuestName, getRewardName, getTaskType, getTimeRemaining, questId, FILTER_LABELS, avatarUrl, premiumLabel } from "../../../discord/api/quests.ts";
import { greetingLine } from "../../../functions/greeting.ts";
import { packageVersion } from "../../../functions/version.ts";


function truncate(str, max) {
  const s = String(str || "");
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

function formatDuration(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}

function progressBar(done, total, width = 12) {
  const pct = total <= 0 ? 1 : Math.min(1, Math.max(0, done / total));
  const filled = Math.round(pct * width);
  const bar = "#".repeat(filled) + "-".repeat(width - filled);
  return `\`[${bar}]\` \`${Math.floor(pct * 100)}%\``;
}

function buildFilterSelect(current = "all") {
  return new StringSelectMenuBuilder()
    .setCustomId("quest:filter")
    .setPlaceholder(`Filtro atual: ${FILTER_LABELS[current] || "Todas"}`)
    .addOptions(
      {
        label: "Todas as recompensas",
        description: "Mostrar todas as quests elegíveis",
        value: "all",
        emoji: "📋",
        default: current === "all"
      },
      {
        label: "Somente Orbs",
        description: "Quests que dão Orbs",
        value: "orbs",
        emoji: "🟣",
        default: current === "orbs"
      },
      {
        label: "Decorações",
        description: "Avatar decorations / collectibles",
        value: "decoration",
        emoji: "✨",
        default: current === "decoration"
      },
      {
        label: "Itens em jogo",
        description: "Recompensas in-game",
        value: "in_game",
        emoji: "🎮",
        default: current === "in_game"
      }
    );
}

function buildAccountsPanel({ accounts = [], activeId = null, discordUsername } = {}) {
  const active = accounts.find(account => String(account.accountId || account.id) === String(activeId));
  const activeName = active?.globalName || active?.username || "nenhuma";
  const lines = accounts.length
    ? accounts.slice(0, 20).map(account => {
        const id = String(account.accountId || account.id);
        const name = truncate(account.globalName || account.username || "Conta sem nome", 32);
        const mark = id === String(activeId) ? "✅" : "⚪";
        return `> ${mark} **${name}** · 🪙 \`${Number(account.orbs || 0).toLocaleString("pt-BR")}\`\n> \`${id}\``;
      }).join("\n")
    : "`📭` Nenhuma conta registrada. Adicione sua primeira conta abaixo.";
  const options = accounts.slice(0, 25).map(account => ({
    label: truncate(account.globalName || account.username || "Conta sem nome", 100),
    description: `${Number(account.orbs || 0).toLocaleString("pt-BR")} orbs · ${account.accountId}`.slice(0, 100),
    value: String(account.accountId || account.id),
    default: String(account.accountId || account.id) === String(activeId)
  }));
  const container = new ContainerBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent("# Manager de contas"),
      new TextDisplayBuilder().setContent(greetingLine(discordUsername)),
      new TextDisplayBuilder().setContent(`Conta ativa para missões: **${activeName}**\nTotal: \`${accounts.length}\``)
    )
    .addSeparatorComponents(new SeparatorBuilder().setSpacing("Large").setDivider(true))
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent("**Contas vinculadas**"),
      new TextDisplayBuilder().setContent(lines)
    );
  if (options.length) container.addActionRowComponents(new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder().setCustomId("quest:accounts:select").setPlaceholder("Selecione uma conta para ativar").addOptions(options)
  ));
  return container
    .addActionRowComponents(new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("quest:accounts:connect").setLabel("Adicionar conta").setEmoji("➕").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId("quest:accounts:remove_active").setLabel("Remover conta").setEmoji("🗑️").setStyle(ButtonStyle.Danger)
    ))
    .addSeparatorComponents(new SeparatorBuilder().setSpacing("Small").setDivider(true))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent("✅ Verde = token ok · ❌ Vermelho = token caído (selecione para religar)"));
}

function buildAccountPanel({
  user,
  quests = [],
  filter = "all",
  orbs = null,
  discordUsername
} = {}) {
  const name = truncate(user.username || "desconhecido", 32);
  const globalName = truncate(user.global_name || user.display_name || name, 32);
  const id = user.id;
  const thumb = avatarUrl(user);
  const orbsText = orbs == null ? "`—`" : `\`${Number(orbs).toLocaleString("pt-BR")}\``;
  const nitro = premiumLabel(user.premium_type);
  const locale = user.locale || "—";
  const mfa = user.mfa_enabled ? "sim" : "não";
  const verified = user.verified ? "sim" : "não";
  const greet = greetingLine(discordUsername || globalName);

  const questLines =
    quests.length === 0
      ? "> `📭` Nenhuma quest neste filtro."
      : quests
          .slice(0, 12)
          .map((q, i) => {
            const qname = truncate(getQuestName(q), 42);
            const reward = truncate(getRewardName(q), 28);
            const task = getTaskType(q);
            const rem = getTimeRemaining(q);
            return `> \`${i + 1}.\` **${qname}** — \`${reward}\` · \`${task}\` · \`${rem}\``;
          })
          .join("\n");

  const more =
    quests.length > 12 ? `\n> -# +${quests.length - 12} no select abaixo` : "";

  const section = new SectionBuilder().addTextDisplayComponents(
    new TextDisplayBuilder().setContent(`# ${name} \`${id}\``),
    new TextDisplayBuilder().setContent(greet),
    new TextDisplayBuilder().setContent(
      [
        `\`🏷️\` Exibição: **${globalName}**`,
        `\`🟣\` Orbs: ${orbsText}`,
        `\`💎\` Nitro: \`${nitro}\` · \`🌐\` \`${locale}\``,
        `\`🔐\` MFA: \`${mfa}\` · \`✔️\` Verificado: \`${verified}\``,
        `\`🎯\` Quests (${FILTER_LABELS[filter] || "Todas"}): \`${quests.length}\``
      ].join("\n")
    )
  );

  if (thumb) section.setThumbnailAccessory(new ThumbnailBuilder().setURL(thumb));

  const container = new ContainerBuilder()
    .addSectionComponents(section)
    .addSeparatorComponents(new SeparatorBuilder().setSpacing("Large").setDivider(true))
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent("**Conta conectada**"),
      new TextDisplayBuilder().setContent("Altere o token ou remova a conta salva neste bot.")
    )
    .addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("quest:account:change_token")
          .setLabel("Alterar token")
          .setEmoji("🔑")
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId("quest:account:remove")
          .setLabel("Remover conta")
          .setEmoji("🗑️")
          .setStyle(ButtonStyle.Danger)
      )
    )
    .addSeparatorComponents(new SeparatorBuilder().setSpacing("Large").setDivider(true))
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent("**Filtro de recompensa**"),
      new TextDisplayBuilder().setContent("Escolha o tipo antes de selecionar as quests.")
    )
    .addActionRowComponents(new ActionRowBuilder().addComponents(buildFilterSelect(filter)))
    .addSeparatorComponents(new SeparatorBuilder().setSpacing("Large").setDivider(true))
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent("**Quests disponíveis**"),
      new TextDisplayBuilder().setContent(questLines + more)
    );

  if (quests.length > 0) {
    const options = [
      {
        label: "Todas neste filtro",
        description: `Iniciar todas (${quests.length})`,
        value: "all",
        emoji: "🚀"
      },
      ...quests.slice(0, 24).map(q => ({
        label: truncate(getQuestName(q), 100),
        description: truncate(`${getRewardName(q)} · ${getTaskType(q)}`, 100),
        value: String(questId(q))
      }))
    ];

    container
      .addSeparatorComponents(new SeparatorBuilder().setSpacing("Small").setDivider(true))
      .addActionRowComponents(
        new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId("quest:pick")
            .setPlaceholder("Escolha quais quests fazer")
            .setMinValues(1)
            .setMaxValues(Math.min(options.length, 25))
            .addOptions(options)
        )
      );
  }

  return container;
}

export {buildFilterSelect, buildAccountsPanel, buildAccountPanel};
