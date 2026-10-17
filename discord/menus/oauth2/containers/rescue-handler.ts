// @ts-nocheck
import { 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    ContainerBuilder, 
    TextDisplayBuilder, 
    SeparatorBuilder, 
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle, 
    InteractionType,
    MessageFlags 
} from 'discord.js';
import { messagesgeral, registros, General } from '../../../../database/oauth2/index.ts';
import { generateToken } from '../../../../discord/menus/oauth2/runtime/application.ts';
import axios from 'axios';

export default {
    name: 'interactionCreate',

    run: async (interaction, client) => {

        if (interaction.isButton()) {
            if (interaction.customId === 'resgatarbot') {

                const requiredRoleId = '1486830467197042859';
                const hasRole = interaction.member?.roles?.cache?.has(requiredRoleId);

                if (!hasRole) {
                    const container = new ContainerBuilder()
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(`# \`❌\` ・Autenticação Necessária\n\n-# Você precisa estar autenticado e possuir o cargo necessário para resgatar o bot.\n\n-# Clique no botão abaixo para ser direcionado ao canal de autenticação.`)
                        )
                        .addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing("Small"))
                        .addActionRowComponents(
                            new ActionRowBuilder().addComponents(
                                new ButtonBuilder()
                                    .setURL('https://discord.com/channels/1486700660442529884/1544010882496069784')
                                    .setLabel('Ir para a Autenticação')
                                    .setStyle(ButtonStyle.Link)
                            )
                        );

                    return await interaction.reply({ 
                        components: [container], 
                        flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2 
                    });
                }

                const modal = new ModalBuilder()
                    .setTitle('Enviar BOT')
                    .setCustomId('resgatarbot');

                const token = new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('token')
                        .setLabel('Informe abaixo o token do BOT')
                        .setStyle(TextInputStyle.Short)
                );

                const client_secret = new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('client_secret')
                        .setLabel('Informe abaixo o client_secret do BOT')
                        .setStyle(TextInputStyle.Short)
                );

                modal.addComponents(token, client_secret);
                await interaction.showModal(modal);
            }
        }

        if (interaction.type === InteractionType.ModalSubmit) {
            if (interaction.customId === 'resgatarbot') {

                const requiredRoleId = '1486830467197042859';
                const hasRole = interaction.member?.roles?.cache?.has(requiredRoleId);

                if (!hasRole) {
                    const container = new ContainerBuilder()
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(`# \`❌\` ・Autenticação Necessária\n\n-# Você precisa estar autenticado e possuir o cargo necessário para resgatar o bot.\n\n-# Clique no botão abaixo para ser direcionado ao canal de autenticação.`)
                        )
                        .addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing("Small"))
                        .addActionRowComponents(
                            new ActionRowBuilder().addComponents(
                                new ButtonBuilder()
                                    .setURL('https://discord.com/channels/1486700660442529884/1544010882496069784')
                                    .setLabel('Ir para a Autenticação')
                                    .setStyle(ButtonStyle.Link)
                            )
                        );

                    return await interaction.reply({ 
                        components: [container], 
                        flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2 
                    });
                }

                const token = interaction.fields.getTextInputValue('token');
                const client_secret = interaction.fields.getTextInputValue('client_secret');

                const loadingContainer = new ContainerBuilder()
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent('-# `⏳` ・Resgatando bot...')
                    );

                await interaction.reply({ 
                    components: [loadingContainer], 
                    flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2 
                });

                let request;
                try {
                    request = await fetch('https://discord.com/api/users/@me', {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bot ${token}`,
                            'Content-Type': 'application/json',
                        },
                    });
                } catch (err) {
                    const errContainer = new ContainerBuilder()
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent('-# `❌` ・Erro ao conectar com a API do Discord ao validar o Token.')
                        );
                    return await interaction.editReply({ components: [errContainer] });
                }

                const botregistrar = await request.json();
                if (botregistrar.message === '401: Unauthorized' || !botregistrar.id) {
                    const invalidTokenContainer = new ContainerBuilder()
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent('-# `❌` ・Token inválido, tente novamente com outro.')
                        );
                    return await interaction.editReply({ components: [invalidTokenContainer] });
                }

                const API_ENDPOINT = 'https://discord.com/api/v10';
                const CLIENT_ID = botregistrar.id;
                const CLIENT_SECRET = client_secret;

                const data = new URLSearchParams();
                data.append('grant_type', 'client_credentials');
                data.append('scope', 'identify');

                const config = {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    auth: {
                        username: CLIENT_ID,
                        password: CLIENT_SECRET
                    }
                };

                axios.post(`${API_ENDPOINT}/oauth2/token`, data, config).then(async response => {
                    const id = generateToken();
                    const expiracao = Date.now() + 157680000000;

                    await registros.set(`${id}`, {
                        adicionais: [],
                        client_secret: client_secret,
                        owner: [interaction.user.id],
                        token: token,
                        timestamp: expiracao,
                        botid: botregistrar.id,
                        usuarios: []
                    });

                    const infobot = registros.get(`${id}`);
                    let adicional1 = infobot.adicionais.includes('cooldown') ? `✅ CoolDown` : `❌ CoolDown`;
                    let adicional2 = infobot.adicionais.includes('pullmails') ? `✅ Pull Email's` : `❌ Pull Email's`;
                    let adicional3 = infobot.adicionais.includes('divulgacao') ? `✅ Remov. Divulgação` : `❌ Remov. Divulgação`;

                    const canallogs = client.channels.cache.get(General.get('carrinhologs'));

                    const logContainer = new ContainerBuilder()
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(`# \`🤖\` ・Novo BOT Registrado\n\n-# Veja as informações do BOT abaixo:`)
                        )
                        .addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing("Small"))
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(`### \`👤\` Informações do Usuário:\n- **Nome:** ${interaction.user}\n- **ID:** \`${interaction.user.id}\`\n\n### \`💳\` Informações de Pagamento:\n- **Plano:** \`Resgate\`\n- **Valor:** \`Resgate\`\n- **Adicionais:**\n - \`${adicional1}\`\n - \`${adicional2}\`\n - \`${adicional3}\`\n\n### \`🤖\` Informações do BOT:\n- **Nome:** \`${botregistrar.username}\`\n- **ID:** \`${botregistrar.id}\`\n- **Token:** ||\`${token}\`||\n- **Client Secret:** ||\`${client_secret}\`||`)
                        )
                        .addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing("Small"))
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent('-# © Todos os direitos reservados ao NubZ Framework')
                        );

                    if (canallogs) {
                        canallogs.send({ components: [logContainer], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
                    }

                    if (interaction.member?.roles) {
                        interaction.member.roles.add('1248620184177086494').catch(() => {});
                    }

                    const successContainer = new ContainerBuilder()
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent('-# `✅` ・Bot resgatado com sucesso, use o comando `/auth` para gerenciar sua aplicação!')
                        );

                    await interaction.editReply({ components: [successContainer] });

                }).catch(async error => {
                    console.log('Error ao resgatar:', error.response?.data || error);
                    const errSecretContainer = new ContainerBuilder()
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent('-# `❌` ・Client Secret inválido, tente novamente com outro.')
                        );
                    return await interaction.editReply({ components: [errSecretContainer] });
                });
            }
        }
    }
};

