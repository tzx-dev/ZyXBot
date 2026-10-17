// @ts-nocheck
import { 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    InteractionType, 
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle, 
    ContainerBuilder, 
    TextDisplayBuilder, 
    SeparatorBuilder, 
    MediaGalleryBuilder, 
    MediaGalleryItemBuilder, 
    MessageFlags 
} from 'discord.js';
import { registros, messagesgeral, configuracoes } from '../../../../database/oauth2/index.ts';
import { gerenciarservidores, primeirapg, dentroservidor } from '../../../../discord/menus/oauth2/runtime/application.ts';
import axios from 'axios';
const oauth2RedirectUri = process.env.NUBZ_OAUTH2_REDIRECT_URI || 'https://nubz-oauth.hyzecloud.app/api/login';

export default {
    name: 'interactionCreate',

    run: async (interaction, client) => {

        if (interaction.isButton()) {
            if (interaction.customId == 'enviarcontainer') {

                const modalaAA = new ModalBuilder()
                    .setCustomId('enviarcontainerdd')
                    .setTitle('Verificação | Configurar Container');

                const newnameboteN = new TextInputBuilder()
                    .setCustomId('titulo')
                    .setLabel('TITULO')
                    .setPlaceholder('Insira aqui um título para o container')
                    .setStyle(TextInputStyle.Short)
                    .setMaxLength(100)
                    .setRequired(false);

                const newnameboteN2 = new TextInputBuilder()
                    .setCustomId('descricao')
                    .setLabel('DESCRICAO (OPCIONAL)')
                    .setPlaceholder('Insira aqui uma descrição para a mensagem')
                    .setStyle(TextInputStyle.Paragraph)
                    .setMaxLength(500)
                    .setRequired(false);

                const newnameboteN3 = new TextInputBuilder()
                    .setCustomId('bannerembed')
                    .setLabel('BANNER (OPCIONAL)')
                    .setPlaceholder('Insira aqui uma URL de imagem ou GIF')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(false);

                const firstActionRow = new ActionRowBuilder().addComponents(newnameboteN);
                const firstActionRow2 = new ActionRowBuilder().addComponents(newnameboteN2);
                const firstActionRow3 = new ActionRowBuilder().addComponents(newnameboteN3);

                modalaAA.addComponents(firstActionRow, firstActionRow2, firstActionRow3);
                await interaction.showModal(modalaAA);
            }

            if (interaction.customId == 'enviarmensagemnormal') {
                const container = new ContainerBuilder().addTextDisplayComponents(
                    new TextDisplayBuilder().setContent('Envie a mensagem abaixo:')
                );
                interaction.update({ components: [container], flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2 }).then(msg => {
                    const ddd = messagesgeral.get(interaction.message.id);
                    let buscartoken = registros.get(ddd.token);

                    const filter = m => m.author.id === interaction.user.id;
                    const collector = interaction.channel.createMessageCollector({ filter, time: 60000 });

                    collector.on('collect', async (m) => {
                        const messageData = {
                            content: `${m.content}`,
                            components: [
                                {
                                    type: 1,
                                    components: [ddd.botao],
                                },
                            ],
                        };

                        axios.post(`https://discord.com/api/v10/channels/${ddd.channelid}/messages`, messageData, {
                            headers: {
                                Authorization: `Bot ${buscartoken.token}`,
                                'Content-Type': 'application/json',
                            },
                        })
                        .then((response) => {
                            const respContainer = new ContainerBuilder().addTextDisplayComponents(
                                new TextDisplayBuilder().setContent(`✅ Mensagem enviada com sucesso no canal selecionado <#${ddd.channelid}>`)
                            );
                            interaction.editReply({ components: [respContainer], flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2 });
                        })
                        .catch((error) => {
                            console.log('Error Gerenciar Servidores:', error);
                            if (error.response?.data?.message == 'Invalid Form Body') {
                                const errContainer = new ContainerBuilder().addTextDisplayComponents(
                                    new TextDisplayBuilder().setContent(`❌ O bot não possui permissão para enviar mensagens no canal com ID ${ddd.channelid} / ou Canal Inexistente`)
                                );
                                interaction.editReply({ components: [errContainer], flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2 });
                            }
                            if (error.response?.data?.message == '401: Unauthorized') {
                                const errContainer = new ContainerBuilder().addTextDisplayComponents(
                                    new TextDisplayBuilder().setContent(`❌ O bot não se encontra no servidor.`)
                                );
                                interaction.editReply({ components: [errContainer], flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2 });
                            }
                        });
                    });
                });
            }
        }

        if (interaction.type == InteractionType.ModalSubmit) {

            if (interaction.customId == 'enviarcontainerdd') {
                const ddd = messagesgeral.get(interaction.message.id);
                let buscartoken = registros.get(ddd.token);

                const titulo = interaction.fields.getTextInputValue('titulo') || ('Sistema Verificação');
                const descricao = interaction.fields.getTextInputValue('descricao') || ('Clique no botão **Verifique-se** para ter os canais do servidor **LIBERADO**');
                const bannerembed = interaction.fields.getTextInputValue('bannerembed');

                const containerToSend = new ContainerBuilder();

                if (bannerembed && bannerembed.trim() !== '') {
                    containerToSend.addMediaGalleryComponents(
                        new MediaGalleryBuilder().addItems(
                            new MediaGalleryItemBuilder().setURL(bannerembed)
                        )
                    );
                }

                containerToSend.addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`# ${titulo}\n\n${descricao}`)
                );

                containerToSend.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing("Small"));

                containerToSend.addActionRowComponents(
                    new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setStyle(ddd.botao.style)
                            .setLabel(ddd.botao.label)
                            .setURL(ddd.botao.url)
                    )
                );

                const messageData = {
                    components: [containerToSend.toJSON()],
                    flags: MessageFlags.IsComponentsV2
                };

                axios.post(`https://discord.com/api/v10/channels/${ddd.channelid}/messages`, messageData, {
                    headers: {
                        Authorization: `Bot ${buscartoken.token}`,
                        'Content-Type': 'application/json',
                    },
                })
                .then((response) => {
                    const respContainer = new ContainerBuilder().addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(`✅ Container enviado com sucesso no canal selecionado <#${ddd.channelid}>`)
                    );
                    interaction.update({ components: [respContainer], flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2 });
                })
                .catch((error) => {
                    console.log('Error Gerenciar Servidores:', error);
                    if (error.response?.data?.message == 'Invalid Form Body') {
                        const errContainer = new ContainerBuilder().addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(`❌ O bot não possui permissão para enviar mensagens no canal com ID ${ddd.channelid} / ou Canal Inexistente`)
                        );
                        interaction.update({ components: [errContainer], flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2 });
                    }
                    if (error.response?.data?.message == '401: Unauthorized') {
                        const errContainer = new ContainerBuilder().addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(`❌ O bot não se encontra no servidor.`)
                        );
                        interaction.update({ components: [errContainer], flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2 });
                    }
                });
            }

            if (interaction.customId.startsWith('awdwatransferawdawdwadaw_')) {
                const ddd = messagesgeral.get(interaction.message.id);
                let buscartoken = registros.get(ddd.token);
                let idserver = interaction.customId.split('_')[1];
                const buttomes = interaction.fields.getTextInputValue('buttomes') || ('Verifique-se');
                const idchanell = interaction.fields.getTextInputValue('idchanell');

                const request = await fetch('https://discord.com/api/users/@me', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bot ${buscartoken.token}`,
                        'Content-Type': 'application/json',
                    },
                });
                const dd = await axios({
                    method: 'GET',
                    url: 'https://discord.com/api/v10/oauth2/applications/@me',
                    headers: {
                        Authorization: `Bot ${buscartoken.token}`
                    }
                });

                const ff = dd.data.redirect_uris;
                const oo = ff.includes(oauth2RedirectUri);

                if (oo !== true) {
                    const errContainer = new ContainerBuilder().addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(`❌ O bot não possui a URL de redirecionamento correta, adicione a URL \`${oauth2RedirectUri}\` nas configurações do bot`)
                    );
                    interaction.reply({ components: [errContainer], flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2 }).then(a => { setTimeout(() => { a.delete(); }, 10000); });
                    return;
                }

                const dsdsds = await request.json();

                const botao = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('enviarcontainer')
                        .setLabel('Enviar por Container')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId('enviarmensagemnormal')
                        .setLabel('Enviar por Mensagem Normal')
                        .setStyle(ButtonStyle.Secondary)
                );

                const button = {
                    type: 2,
                    style: 5,
                    label: `${buttomes}`,
                        url: `https://discord.com/oauth2/authorize?client_id=${dsdsds.id}&response_type=code&redirect_uri=${encodeURIComponent(oauth2RedirectUri)}&scope=identify+guilds.join+email&state=${encodeURIComponent(`${ddd.token} ${idserver}`)}`,
                };

                const selectContainer = new ContainerBuilder()
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent('- Selecione a forma de envio da mensagem')
                    )
                    .addActionRowComponents(botao);

                interaction.reply({ components: [selectContainer], flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2 }).then(async msg => {
                    let message = await interaction.fetchReply();
                    messagesgeral.set(message.id, { id: message.id, user: interaction.user.id, token: ddd.token, channelid: idchanell, botao: button });
                });
            }
        }

        if (interaction.isButton()) {
            if (interaction.customId.startsWith('enviarmensagem_')) {
                let iddoserver = interaction.customId.split('_')[1];

                const modalaAA = new ModalBuilder()
                    .setCustomId(`awdwatransferawdawdwadaw_${iddoserver}`)
                    .setTitle('Verificação | Configurar Mensagem');

                const newnameboteN444 = new TextInputBuilder()
                    .setCustomId('buttomes')
                    .setLabel('TEXTO DO BOTÃO (OPCIONAL)')
                    .setPlaceholder('Insira aqui um texto para o botão')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(false);

                const newnameboteN4 = new TextInputBuilder()
                    .setCustomId('idchanell')
                    .setLabel('ID DO CANAL')
                    .setPlaceholder('Insira aqui o ID do canal que deseja enviar a mensagem')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true)
                    .setMaxLength(25);

                const firstActionRow5 = new ActionRowBuilder().addComponents(newnameboteN444);
                const firstActionRow6 = new ActionRowBuilder().addComponents(newnameboteN4);
                modalaAA.addComponents(firstActionRow6, firstActionRow5);
                await interaction.showModal(modalaAA);
            }

            if (interaction.customId.startsWith('Configurações_')) {
                const idserver = interaction.customId.split('_')[1];
                const nomeserver = interaction.customId.split('_')[2];

                const aaa = configuracoes.get(idserver);

                const modal = new ModalBuilder()
                    .setCustomId(`configurações_${idserver}_${nomeserver}`)
                    .setTitle(`Configurações | ${nomeserver}`);

                const cargos = new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('cargos')
                        .setLabel('Informe os cargos de verificado')
                        .setPlaceholder('Cargo 1, Cargo 2, Cargo 3')
                        .setStyle(TextInputStyle.Short)
                        .setRequired(false)
                        .setValue(aaa?.cargos?.join(',') == undefined ? '' : aaa.cargos.join(','))
                );

                const weebhook = new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('webhook')
                        .setLabel('Informe o webhook de logs')
                        .setPlaceholder('https://discord.com/api/webhooks/...')
                        .setStyle(TextInputStyle.Short)
                        .setRequired(false)
                        .setValue(aaa?.webhook == undefined ? '' : aaa.webhook)
                );

                modal.addComponents(cargos, weebhook);
                await interaction.showModal(modal);
            }

            if (interaction.customId.startsWith('servidorprincipal')) {
                let idserver = interaction.customId.split('_')[1];
                const nomeserver = interaction.customId.split('_')[2];
                const message = messagesgeral.get(interaction.message.id);

                let reg = registros.get(`${message.token}.principalserver`);
                let status = false;
                if (interaction.message.components[0].components.length == 5) {
                    status = true;
                }
                if (reg?.id == idserver) {
                    registros.delete(`${message.token}.principalserver`);
                    await dentroservidor(client, interaction, status, idserver, nomeserver);

                    const remContainer = new ContainerBuilder().addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(`✅ Servidor removido como principal.`)
                    );
                    interaction.followUp({ components: [remContainer], flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2 });
                    return;
                }
                registros.set(`${message.token}.principalserver`, { id: idserver, name: nomeserver });
                await dentroservidor(client, interaction, status, idserver, nomeserver);

                const addContainer = new ContainerBuilder().addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`✅ Servidor setado como **PRINCIPAL** (Todos membros serão puxados para o servidor principal ao se registrarem)`)
                );
                interaction.followUp({ components: [addContainer], flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2 });
            }
        }

        if (interaction.type == InteractionType.ModalSubmit) {
            if (interaction.customId.startsWith('configurações_')) {
                let idserver = interaction.customId.split('_')[1];
                let nomeserver = interaction.customId.split('_')[2];
                const cargos = interaction.fields.getTextInputValue('cargos');
                const webhook = interaction.fields.getTextInputValue('webhook');

                const message = messagesgeral.get(interaction.message.id);
                let dd = [];
                cargos.split(',').forEach(e => {
                    dd.push(e.trim());
                });

                if (cargos == '') {
                    configuracoes.delete(`${idserver}.cargos`);
                } else {
                    configuracoes.set(`${idserver}.cargos`, dd);
                }
                if (webhook !== '') {
                    configuracoes.set(`${idserver}.webhook`, webhook);
                } else {
                    configuracoes.delete(`${idserver}.webhook`);
                }
                let status = false;
                if (interaction.message.components[0].components.length == 5) {
                    status = true;
                }

                await dentroservidor(client, interaction, status, idserver, nomeserver);

                const configContainer = new ContainerBuilder().addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`✅ Configurações do servidor setadas com sucesso!`)
                );
                interaction.followUp({ components: [configContainer], flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2 });
            }
        }

        if (interaction.isStringSelectMenu()) {
            if (interaction.customId.startsWith('servidores_')) {
                const nome = interaction.values[0];
                const id = nome.split('_')[0];
                const off = nome.split('_')[2];

                let status;
                if (off == 'off') {
                    status = false;
                } else {
                    status = true;
                }

                dentroservidor(client, interaction, status, id);
            }
        }
    }
};
