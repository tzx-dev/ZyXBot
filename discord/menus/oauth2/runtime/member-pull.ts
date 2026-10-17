// @ts-nocheck
import e from "express";
import { PullRequest, registros, messagesgeral, General } from "../../../../database/oauth2/index.ts";
import axios from "axios";
import { ActionRowBuilder, ButtonBuilder, InteractionType, ChannelType, PermissionsBitField, ContainerBuilder, TextDisplayBuilder, MessageFlags } from "discord.js";

let execucaoPorID = {};
async function PullStartMembers(client) {
    let successfulAdditions = 0;
    let PedidosPendentes = PullRequest.filter(x => x.data.status === 'Pendente');

    const processPullRequest = async (pullRequest) => {
        if (execucaoPorID[pullRequest.ID]) return;
        execucaoPorID[pullRequest.ID] = true;

        let members;
        let information = registros.get(pullRequest.data.token);
        if (!pullRequest.data.idoldserver) {
            members = (information?.usuarios ?? []).filter(user => user.access_token !== 'unauthorized')
                .sort(() => Math.random() - 0.5);
        } else {
            let members2 = (information?.usuarios ?? []).filter(user => user.access_token !== 'unauthorized')
                .sort(() => Math.random() - 0.5);
            members = members2.filter(usuario => usuario.serverid.some(server => server.idserver === pullRequest.data.idoldserver));
        }

        const allMembers = await getAllMembers(pullRequest.data.idnewserver, information.token);

        if (allMembers === 10004) {
            await updateCancel(pullRequest, client);
            return;
        }

        const userIds = allMembers.map(member => member.user.id);
        members = members.filter(member => !userIds.includes(member.userid));

        if (members.length === 0) {
            await updateRequestStatus(pullRequest, 'Concluido Parcialmente', client);
            return;
        }

        await members.reduce(async (promise, puxaruser, key) => {
            await promise;

            let pullinfo = PullRequest.get(pullRequest.ID);
            if (pullinfo.qtdpuxados >= pullinfo.quantidade) {
                await updateRequestStatus(pullRequest, 'Concluido', client);
                return;
            }

            let result = await addMemberToGuild(puxaruser, pullRequest, information);
            await new Promise(resolve => setTimeout(resolve, 600));

            if (result === 201) {
                successfulAdditions++;
                if (successfulAdditions % 2 === 0) {
                    await updateProgress(pullRequest, client);
                }
            } else if (result === 10004) {
                await updateCancel(pullRequest, client);
                return;
            }

            if (members.length === (key + 1) && PullRequest.get(pullRequest.ID).quantidade > PullRequest.get(pullRequest.ID).qtdpuxados) {
                await updateRequestStatus(pullRequest, 'Concluido Parcialmente', client);
            }

        }, Promise.resolve());

        let pullinfo = PullRequest.get(pullRequest.ID);
        if (pullinfo.qtdpuxados >= pullinfo.quantidade) {
            await updateRequestStatus(pullRequest, 'Concluido', client);
        }
    };

    const pullRequestPromises = PedidosPendentes.map(processPullRequest);
    await Promise.all(pullRequestPromises);
}

async function addMemberToGuild(user, pullRequest, information) {
    let body = { access_token: user.access_token };

    try {
        let response = await axios.put(`https://discord.com/api/guilds/${pullRequest.data.idnewserver}/members/${user.userid}`, JSON.stringify(body), {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bot ${information.token}`,
            },
        });
        const ff = PullRequest.get(pullRequest.ID);
        ff.qtdpuxados += 1;
        await PullRequest.set(`${pullRequest.ID}.qtdpuxados`, ff.qtdpuxados);
        return 201;

    } catch (error) {
        console.log(error.response?.data)
        if (error.response?.data.code === 50025 || error.response?.data.code == 10013) {
            let user2 = information.usuarios
            let danificaruser = user2.find(user2 => user2.userid == user.userid)
            danificaruser.access_token = 'unauthorized'
            registros.set(`${pullRequest.data.token}.usuarios`, information.usuarios)
            return;
        }
        if (error.response?.data.code === 10004) {
            return 10004
        }
    }
}

async function getAllMembers(guildId, token) {
    let allMembers = [];
    let hasMore = true;
    let after = '';

    while (hasMore) {
        let response
        try {
            response = await axios.get(`https://discord.com/api/guilds/${guildId}/members?limit=1000${after ? `&after=${after}` : ''}`, {
                headers: { Authorization: `Bot ${token}` }
            });
            allMembers.push(...response.data);
            hasMore = response.data.length === 1000;
            after = response.data[response.data.length - 1]?.user?.id;
        } catch (error) {
			console.log(error)
            return 10004
        }
    }
    return allMembers;
}

async function updateCancel(pullRequest, client) {
    PullRequest.set(`${pullRequest.ID}.status`, 'Cancelado');
    const ff = PullRequest.get(pullRequest.ID);

    const container = new ContainerBuilder()
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`## Pedido de Puxar Membros - ❌ Cancelado\nOlá <@!${pullRequest.data.message.user}>, Sua solicitação foi cancelada.\n\n**Informações:**\n- **Servidor:** \`${pullRequest.data.idnewserver} (Não Encontrado)\`\n- **Membros:** \`${ff.qtdpuxados}\`/\`${ff.quantidade}\`\n- **Status:** \`Cancelado\`\n- **Ultima atualização:** <t:${Math.floor(Date.now() / 1000)}:R>`)
        );

    const containerLogs = new ContainerBuilder()
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`## Logs de Puxar Membros - ❌ Cancelado\nUsuário <@!${pullRequest.data.message.user}> fez um pedido.\n\n**Informações:**\n- **Servidor:** \`${pullRequest.data.idnewserver} (Não Encontrado)\`\n- **Membros:** \`${ff.qtdpuxados}\`/\`${ff.quantidade}\`\n- **Status:** \`Cancelado\`\n- **Ultima atualização:** <t:${Math.floor(Date.now() / 1000)}:R>`)
        );

    let channellog = await client.channels.fetch(pullRequest.data.messagelog.channel);
    let mensagemlog = await channellog.messages.fetch(pullRequest.data.messagelog.id);
    mensagemlog.edit({ components: [containerLogs], flags: MessageFlags.IsComponentsV2 });

    try {
        let channel = await client.channels.fetch(pullRequest.data.message.channel);
        let mensagem = await channel.messages.fetch(pullRequest.data.message.id);
        await mensagem.edit({ components: [container], flags: MessageFlags.IsComponentsV2 });
    } catch (error) {}
    return;
}

async function updateProgress(pullRequest, client) {
    const ff = PullRequest.get(pullRequest.ID);
    const container = new ContainerBuilder()
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`## Pedido de Puxar Membros - 🟡 Em andamento\nOlá <@!${pullRequest.data.message.user}>, Sua solicitação está em andamento.\n\n**Informações:**\n- **Servidor:** \`${pullRequest.data.idnewserver}\`\n- **Membros:** \`${ff.qtdpuxados}\`/\`${ff.quantidade}\`\n- **Status:** \`Em andamento\`\n- **Ultima atualização:** <t:${Math.floor(Date.now() / 1000)}:R>`)
        );

    const containerLogs = new ContainerBuilder()
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`## Logs de Puxar Membros - 🟡 Em andamento\nUsuário <@!${pullRequest.data.message.user}> fez um pedido.\n\n**Informações:**\n- **Servidor:** \`${pullRequest.data.idnewserver}\`\n- **Membros:** \`${ff.qtdpuxados}\`/\`${ff.quantidade}\`\n- **Status:** \`Em andamento\`\n- **Ultima atualização:** <t:${Math.floor(Date.now() / 1000)}:R>`)
        );

    let channellog = await client.channels.fetch(pullRequest.data.messagelog.channel);
    let mensagemlog = await channellog.messages.fetch(pullRequest.data.messagelog.id);
    await mensagemlog.edit({ components: [containerLogs], flags: MessageFlags.IsComponentsV2 });

    try {
        let channel = await client.channels.fetch(pullRequest.data.message.channel);
        let mensagem = await channel.messages.fetch(pullRequest.data.message.id);
        await mensagem.edit({ components: [container], flags: MessageFlags.IsComponentsV2 });
    } catch (error) {}
}

async function updateRequestStatus(pullRequest, status, client) {
    PullRequest.set(`${pullRequest.ID}.status`, status);
    const statusEmoji = status === 'Concluido Parcialmente' ? '🟣' : '🟢';

    const container = new ContainerBuilder()
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`## Pedido de Puxar Membros - ${statusEmoji} ${status}\nOlá <@!${pullRequest.data.message.user}>, Sua solicitação foi ${status.toLowerCase()}.\n\n**Informações:**\n- **Servidor:** \`${pullRequest.data.idnewserver}\`\n- **Membros:** \`${PullRequest.get(pullRequest.ID).qtdpuxados}\`/\`${PullRequest.get(pullRequest.ID).quantidade}\`\n- **Status:** \`${status}\`\n- **Ultima atualização:** <t:${Math.floor(Date.now() / 1000)}:R>`)
        );

    const containerLogs = new ContainerBuilder()
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`## Logs de Puxar Membros - ${statusEmoji} ${status}\nUsuário <@!${pullRequest.data.message.user}> fez um pedido.\n\n**Informações:**\n- **Servidor:** \`${pullRequest.data.idnewserver}\`\n- **Membros:** \`${PullRequest.get(pullRequest.ID).qtdpuxados}\`/\`${PullRequest.get(pullRequest.ID).quantidade}\`\n- **Status:** \`${status}\`\n- **Ultima atualização:** <t:${Math.floor(Date.now() / 1000)}:R>`)
        );

    try {
        let channel = await client.channels.fetch(pullRequest.data.message.channel);
        let mensagem = await channel.messages.fetch(pullRequest.data.message.id);
        await mensagem.edit({ components: [container], flags: MessageFlags.IsComponentsV2 });
    } catch (error) {}

    let channellog = await client.channels.fetch(pullRequest.data.messagelog.channel);
    let mensagemlog = await channellog.messages.fetch(pullRequest.data.messagelog.id);
    await mensagemlog.edit({ components: [containerLogs], flags: MessageFlags.IsComponentsV2 });
}

async function PullMembers(interaction, client, idnewserver, quantidade, idoldserver) {
    if (isNaN(quantidade) || quantidade <= 0) return interaction.reply({ content: `Olá o valor \`${quantidade}\` não é um número válido!`, ephemeral: true });

    const message = messagesgeral.get(interaction.message.id);
    const information = registros.get(message.token);

    if (!information.adicionais.includes('cooldown')) {
        if (information.Cooldown?.cooldown >= Date.now()) {
            const datarestante = Math.floor(information.Cooldown?.cooldown / 1000);
            return interaction.reply({ content: `Olá você está em cooldown, aguarde <t:${datarestante}:R> para fazer um novo pedido!`, ephemeral: true });
        }
    }

    if (idoldserver == undefined) {
        dd = (information?.usuarios ?? []).filter(user => user.access_token !== 'unauthorized');
    } else {
        let members2 = (information?.usuarios ?? []).filter(user => user.access_token !== 'unauthorized');
        dd = members2.filter(usuario => usuario.serverid.some(server => server.idserver === idoldserver));
    }

    const config = {
        method: 'get',
        url: `https://discord.com/api/v10/guilds/${idnewserver}/members/${information.botid}`,
        headers: { 'Authorization': `Bot ${information.token}` },
    };

    try {
        const response = await axios(config);
    } catch (error) {
        if (error.response.data.code == 50035 || error.response.data.code == 10003 || error.response.data.code == 10004) {
            const botao = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setURL(`https://discord.com/oauth2/authorize?client_id=${information.botid}&scope=bot&permissions=8`)
                    .setLabel('Adicionar Aplicação')
                    .setStyle(5),
            );
            return interaction.reply({ components: [botao], content: `Olá o seu bot <@!${information.botid}> não se encontra no servidor que está querendo adicionar seus membros`, ephemeral: true });
        }
    }

    if (quantidade > dd.length) return interaction.reply({ content: `Olá o seu bot <@!${information.botid}> possuí apenas \`${dd.length}\` membros autorizados!`, ephemeral: true });

    let dddddd = PullRequest.get(message.token);
    if (dddddd?.status == 'Concluido Parcialmente' || dddddd?.status == 'Em andamento') return interaction.reply({ content: `Olá já existe um pedido de puxar membros em andamento! Para verificar o status digite /pedido ${message.token}`, ephemeral: true });

    interaction.reply({ content: `Requisição feita com sucesso, verifique o processo no seu privado.`, ephemeral: true });

    const container = new ContainerBuilder()
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`## Pedido de Puxar Membros - 🟡 Em andamento\nOlá ${interaction.user}, Sua solicitação está em andamento.\n\n**Informações:**\n- **Servidor:** \`${idnewserver}\`\n- **Membros:** \`0\`/\`${quantidade}\`\n- **Status:** \`Em andamento\`\n- **Ultima atualização:** <t:${Math.floor(Date.now() / 1000)}:R>`)
        );
    let dddd = await interaction.user.send({ components: [container], flags: MessageFlags.IsComponentsV2 });

    const containerLogs = new ContainerBuilder()
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`## Logs de Puxar Membros - 🟡 Em andamento\nUsuário <@!${interaction.user.id}> fez um pedido.\n\n**Informações:**\n- **Servidor:** \`${idnewserver}\`\n- **Membros:** \`0\`/\`${quantidade}\`\n- **Status:** \`Em andamento\`\n- **Ultima atualização:** <t:${Math.floor(Date.now() / 1000)}:R>`)
        );

    let channel = await client.channels.fetch(General.get('channelLog'));
    let messagelog = await channel.send({ components: [containerLogs], flags: MessageFlags.IsComponentsV2 });

    PullRequest.set(generateToken(20), { token: message.token, idnewserver: idnewserver, quantidade: Number(quantidade), idoldserver: idoldserver, qtdpuxados: 0, status: 'Pendente', message: { id: dddd.id, user: interaction.user.id, channel: dddd.channel.id }, messagelog: { id: messagelog.id, channel: messagelog.channel.id } });

    let timestampAtual = Date.now();
    let timestampMais10Minutos = timestampAtual + (10 * 60 * 1000);
    registros.set(`${message.token}.Cooldown`, { cooldown: timestampMais10Minutos, timestamp: Date.now() });
}

let ignoraruser = []
async function StartPullMembers(client) {
    let execucaoPorID = {};
    let dddd = PullRequest.fetchAll();
    dddd = dddd.filter(item => item.data.status !== 'Concluido' && item.data.status !== 'Concluido Parcialmente' && item.data.status !== 'Cancelado');

    for (const key in dddd) {
        if (execucaoPorID[dddd[key].ID]) return;
        execucaoPorID[dddd[key].ID] = true;
        let members;

        let information = registros.get(dddd[key].data.token);
        if (dddd[key].data.idoldserver == undefined) {
            members = (information?.usuarios ?? []).filter(user => user.access_token !== 'unauthorized').sort(() => Math.random() - 0.5);
        } else {
            let members2 = (information?.usuarios ?? []).filter(user => user.access_token !== 'unauthorized').sort(() => Math.random() - 0.5);
            members = members2.filter(usuario => usuario.serverid.some(server => server.idserver === dddd[key].data.idoldserver));
        }

        const getAllMembers = async (guildId, token) => {
            let allMembers = [];
            let hasMore = true;
            let after = '';
            while (hasMore) {
                const response = await axios.get(`https://discord.com/api/guilds/${guildId}/members?limit=1000${after ? `&after=${after}` : ''}`, {
                    headers: { Authorization: `Bot ${token}` }
                });
                allMembers.push(...response.data);
                hasMore = response.data.length === 1000;
                after = response.data[response.data.length - 1]?.user?.id;
            }
            return allMembers;
        };

        if (information == null) {
            PullRequest.set(`${dddd[key].ID}.status`, 'Cancelado');
            const container = new ContainerBuilder().addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`## Pedido de Puxar Membros - ❌ Cancelado\nOlá <@!${dddd[key].data.message.user}>, Sua solicitação foi cancelada.\n\n**Informações:**\n- **Servidor:** \`${dddd[key].data.idnewserver}\`\n- **Membros:** \`0\`/\`${PullRequest.get(dddd[key].ID).quantidade}\`\n- **Status:** \`Cancelado\`\n- **Ultima atualização:** <t:${Math.floor(Date.now() / 1000)}:R>`)
            );
            let channel = await client.channels.fetch(dddd[key].data.message.channel);
            let mensagem = await channel.messages.fetch(dddd[key].data.message.id);
            await mensagem.edit({ components: [container], flags: MessageFlags.IsComponentsV2 });
            return;
        }

        await getAllMembers(dddd[key].data.idnewserver, information.token).then(allMembers => {
            const userIds = allMembers.map(member => member.user.id);
            members = members.filter(member => !userIds.includes(member.userid));
        }).catch(error => {});

        members = members.filter(member => !ignoraruser.includes(member.userid));

        let channel = await client.channels.fetch(dddd[key].data.message.channel);
        let mensagem = await channel.messages.fetch(dddd[key].data.message.id);
        const ff = PullRequest.get(dddd[key].ID);

        if (ff.qtdpuxados == ff.quantidade) {
            PullRequest.set(`${dddd[key].ID}.status`, 'Concluido');
            const container = new ContainerBuilder().addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`## Pedido de Puxar Membros - 🟢 Finalizado\nOlá <@!${dddd[key].data.message.user}>, Sua solicitação foi concluída.\n\n**Informações:**\n- **Servidor:** \`${dddd[key].data.idnewserver}\`\n- **Membros:** \`${ff.qtdpuxados}\`/\`${ff.quantidade}\`\n- **Status:** \`Finalizado\`\n- **Ultima atualização:** <t:${Math.floor(Date.now() / 1000)}:R>`)
            );
            mensagem.edit({ components: [container], flags: MessageFlags.IsComponentsV2 });

            const containerLogs = new ContainerBuilder().addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`## Logs de Puxar Membros - 🟢 Finalizado\nO usuário <@!${dddd[key].data.message.user}> concluiu o pedido.\n\n**Informações:**\n- **Servidor:** \`${dddd[key].data.idnewserver}\`\n- **Membros:** \`${ff.qtdpuxados}\`/\`${ff.quantidade}\`\n- **Status:** \`Finalizado\`\n- **Ultima atualização:** <t:${Math.floor(Date.now() / 1000)}:R>`)
            );
            let channellog = await client.channels.fetch(dddd[key].data.messagelog.channel);
            let mensagemlog = await channellog.messages.fetch(dddd[key].data.messagelog.id);
            mensagemlog.edit({ components: [containerLogs], flags: MessageFlags.IsComponentsV2 });
            return;
        }

        let userResult = members[0];

        if (userResult == undefined) {
            if (ff.qtdpuxados == 0) {
                PullRequest.set(`${dddd[key].ID}.status`, 'Cancelado');
                const container = new ContainerBuilder().addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`## Pedido de Puxar Membros - ❌ Cancelado\nOlá <@!${dddd[key].data.message.user}>, Sua solicitação foi cancelada.\n\n**Informações:**\n- **Servidor:** \`${dddd[key].data.idnewserver}\`\n- **Membros:** \`${ff.qtdpuxados}\`/\`${ff.quantidade}\`\n- **Status:** \`Cancelado\`\n- **Ultima atualização:** <t:${Math.floor(Date.now() / 1000)}:R>`)
                );
                const containerLogs = new ContainerBuilder().addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`## Logs de Puxar Membros - ❌ Cancelado\nO pedido foi cancelado.\n\n**Informações:**\n- **Servidor:** \`${dddd[key].data.idnewserver}\`\n- **Membros:** \`${ff.qtdpuxados}\`/\`${ff.quantidade}\`\n- **Status:** \`Cancelado\`\n- **Ultima atualização:** <t:${Math.floor(Date.now() / 1000)}:R>`)
                );
                let channellog = await client.channels.fetch(dddd[key].data.messagelog.channel);
                let mensagemlog = await channellog.messages.fetch(dddd[key].data.messagelog.id);
                mensagemlog.edit({ components: [containerLogs], flags: MessageFlags.IsComponentsV2 });
                mensagem.edit({ components: [container], flags: MessageFlags.IsComponentsV2 });
                return;
            }

            PullRequest.set(`${dddd[key].ID}.status`, 'Concluido Parcialmente');
            const container = new ContainerBuilder().addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`## Pedido de Puxar Membros - 🟣 Concluído Parcialmente\nOlá <@!${dddd[key].data.message.user}>, Sua solicitação foi concluída parcialmente.\n\n**Informações:**\n- **Servidor:** \`${dddd[key].data.idnewserver}\`\n- **Membros:** \`${ff.qtdpuxados}\`/\`${ff.quantidade}\`\n- **Status:** \`Concluído Parcialmente\`\n- **Ultima atualização:** <t:${Math.floor(Date.now() / 1000)}:R>`)
            );
            const containerLogs = new ContainerBuilder().addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`## Logs de Puxar Membros - 🟣 Concluído Parcialmente\nPedido de puxar concluído parcialmente.\n\n**Informações:**\n- **Servidor:** \`${dddd[key].data.idnewserver}\`\n- **Membros:** \`${ff.qtdpuxados}\`/\`${ff.quantidade}\`\n- **Status:** \`Concluído Parcialmente\`\n- **Ultima atualização:** <t:${Math.floor(Date.now() / 1000)}:R>`)
            );
            let channellog = await client.channels.fetch(dddd[key].data.messagelog.channel);
            let mensagemlog = await channellog.messages.fetch(dddd[key].data.messagelog.id);
            mensagemlog.edit({ components: [containerLogs], flags: MessageFlags.IsComponentsV2 });
            mensagem.edit({ components: [container], flags: MessageFlags.IsComponentsV2 });
            return;
        }

        try {
            let body = { access_token: userResult.access_token };
            let response2 = await axios.put(`https://discord.com/api/guilds/${dddd[key].data.idnewserver}/members/${userResult.userid}`, JSON.stringify(body), {
                headers: { "Content-Type": "application/json", Authorization: `Bot ${information.token}` },
            });

            if (response2.data.user || response2.data == '') {
                ff.qtdpuxados += 1;
                await PullRequest.set(`${dddd[key].ID}.qtdpuxados`, ff.qtdpuxados);
                if (ff.qtdpuxados == ff.quantidade) {
                    PullRequest.set(`${dddd[key].ID}.status`, 'Concluido');
                    const container = new ContainerBuilder().addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(`## Pedido de Puxar Membros - 🟢 Finalizado\nOlá <@!${dddd[key].data.message.user}>, Sua solicitação foi finalizada.\n\n**Informações:**\n- **Servidor:** \`${dddd[key].data.idnewserver}\`\n- **Membros:** \`${ff.qtdpuxados}\`/\`${ff.quantidade}\`\n- **Status:** \`Finalizado\`\n- **Ultima atualização:** <t:${Math.floor(Date.now() / 1000)}:R>`)
                    );
                    const containerLogs = new ContainerBuilder().addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(`## Logs de Puxar Membros - 🟢 Finalizado\n\n**Informações:**\n- **Servidor:** \`${dddd[key].data.idnewserver}\`\n- **Membros:** \`${ff.qtdpuxados}\`/\`${ff.quantidade}\`\n- **Status:** \`Finalizado\`\n- **Ultima atualização:** <t:${Math.floor(Date.now() / 1000)}:R>`)
                    );
                    let channellog = await client.channels.fetch(dddd[key].data.messagelog.channel);
                    let mensagemlog = await channellog.messages.fetch(dddd[key].data.messagelog.id);
                    mensagemlog.edit({ components: [containerLogs], flags: MessageFlags.IsComponentsV2 });
                    mensagem.edit({ components: [container], flags: MessageFlags.IsComponentsV2 });
                    return;
                }
            }
        } catch (err) {
            if (err.response.data.code == 10004) {
                PullRequest.set(`${dddd[key].ID}.status`, 'Cancelado');
                const container = new ContainerBuilder().addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`## Pedido de Puxar Membros - ❌ Cancelado\nOlá <@!${dddd[key].data.message.user}>, Sua solicitação foi cancelada.\n\n**Informações:**\n- **Servidor:** \`${dddd[key].data.idnewserver} (Não Encontrado)\`\n- **Membros:** \`${ff.qtdpuxados}\`/\`${ff.quantidade}\`\n- **Status:** \`Cancelado\`\n- **Ultima atualização:** <t:${Math.floor(Date.now() / 1000)}:R>`)
                );
                const containerLogs = new ContainerBuilder().addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`## Logs de Puxar Membros - ❌ Cancelado\n\n**Informações:**\n- **Servidor:** \`${dddd[key].data.idnewserver} (Não Encontrado)\`\n- **Membros:** \`${ff.qtdpuxados}\`/\`${ff.quantidade}\`\n- **Status:** \`Cancelado\`\n- **Ultima atualização:** <t:${Math.floor(Date.now() / 1000)}:R>`)
                );
                let channellog = await client.channels.fetch(dddd[key].data.messagelog.channel);
                let mensagemlog = await channellog.messages.fetch(dddd[key].data.messagelog.id);
                mensagemlog.edit({ components: [containerLogs], flags: MessageFlags.IsComponentsV2 });
                mensagem.edit({ components: [container], flags: MessageFlags.IsComponentsV2 });
                return;
            }
            if (err.response.data.code == 30001 || err.response.data.code == 40007) {
                ignoraruser.push(userResult.userid);
                return;
            }
            if (err.response.data.code == 50025 || err.response.data.code == 10013) {
                let danificaruser = information.usuarios.find(user => user.userid == userResult.userid);
                danificaruser.access_token = 'unauthorized';
                registros.set(dddd[key].data.token, information);
            }
        }

        PullRequest.set(`${dddd[key].ID}.qtdpuxados`, ff.qtdpuxados);
        const container = new ContainerBuilder().addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`## Pedido de Puxar Membros - 🟡 Em andamento\nOlá <@!${dddd[key].data.message.user}>, Sua solicitação está em andamento.\n\n**Informações:**\n- **Servidor:** \`${dddd[key].data.idnewserver}\`\n- **Membros:** \`${ff.qtdpuxados}\`/\`${ff.quantidade}\`\n- **Status:** \`Em andamento\`\n- **Ultima atualização:** <t:${Math.floor(Date.now() / 1000)}:R>`)
        );
        const containerLogs = new ContainerBuilder().addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`## Logs de Puxar Membros - 🟡 Em andamento\n\n**Informações:**\n- **Servidor:** \`${dddd[key].data.idnewserver}\`\n- **Membros:** \`${ff.qtdpuxados}\`/\`${ff.quantidade}\`\n- **Status:** \`Em andamento\`\n- **Ultima atualização:** <t:${Math.floor(Date.now() / 1000)}:R>`)
        );

        let channellog = await client.channels.fetch(dddd[key].data.messagelog.channel);
        let mensagemlog = await channellog.messages.fetch(dddd[key].data.messagelog.id);

        mensagemlog.edit({ components: [containerLogs], flags: MessageFlags.IsComponentsV2 });
        mensagem.edit({ components: [container], flags: MessageFlags.IsComponentsV2 });
    }
}

function generateToken() {
    const letters = 'abcdefghijklmnopqrstuvwxyz';
    const numbersAndLetters = '0123456789abcdefghijklmnopqrstuvwxyz';
    let token = letters.charAt(Math.floor(Math.random() * letters.length));
    for (let i = 0; i < 10; i++) {
        token += numbersAndLetters.charAt(Math.floor(Math.random() * numbersAndLetters.length));
    }
    return token;
}

export {
    PullMembers,
    PullStartMembers
};

