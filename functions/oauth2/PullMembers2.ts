// @ts-nocheck
import e from "express";
import { PullRequest, registros } from "../../database/oauth2/index.ts";
import axios from "axios";
import { EmbedBuilder } from "discord.js";



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
            await new Promise(resolve => setTimeout(resolve, 600)); // Para não sobrecarregar o servidor

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

        // Atualizar o status do pedido se todos os membros foram adicionados
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
    PullRequest.set(`${pullRequest.ID}.status`, 'Cancelado')
    const ff = PullRequest.get(pullRequest.ID);

    const embed = new EmbedBuilder()
        .setTitle('Pedido de Puxar Membros')
        .setDescription(`Olá <@!${pullRequest.data.message.user}>, Sua solicitação foi cancelada, verifique o status abaixo.`)
        .setColor('Red')
        .setFields(
            { name: 'Informações:', value: `- Servidor: \`${pullRequest.data.idnewserver} (Não Encontrado)\`\n- Membros: \`${ff.qtdpuxados}\`/\`${ff.quantidade}\`\n- Status: \`Cancelado\`\n- Ultima atualização: <t:${Math.floor(Date.now() / 1000)}:R>`, inline: true },
        )

    const embedlogs = new EmbedBuilder()
        .setTitle('Logs de Puxar Membros')
        .setDescription(`O usuário <@!${pullRequest.data.message.user}> fez um pedido de puxar membros, verifique o status abaixo.`)
        .setColor('Red')
        .setFields(
            { name: 'Informações:', value: `- Servidor: \`${pullRequest.data.idnewserver} (Não Encontrado)\`\n- Membros: \`${ff.qtdpuxados}\`/\`${ff.quantidade}\`\n- Status: \`Cancelado\`\n- Ultima atualização: <t:${Math.floor(Date.now() / 1000)}:R>`, inline: true },
        )

    let channellog = await client.channels.fetch(pullRequest.data.messagelog.channel)
    let mensagemlog = await channellog.messages.fetch(pullRequest.data.messagelog.id)



    mensagemlog.edit({ embeds: [embedlogs] })

    try {


        let channel = await client.channels.fetch(pullRequest.data.message.channel);
        let mensagem = await channel.messages.fetch(pullRequest.data.message.id);
        await mensagem.edit({ embeds: [embed] })
    } catch (error) {

    }
    return

}


async function updateProgress(pullRequest, client) {
    const ff = PullRequest.get(pullRequest.ID);
    const embed = new EmbedBuilder()
        .setTitle('Pedido de Puxar Membros')
        .setDescription(`Olá <@!${pullRequest.data.message.user}>, Sua solicitação está em andamento, verifique o status abaixo.`)
        .setColor('Yellow')
        .setFields(
            { name: 'Informações:', value: `- Servidor: \`${pullRequest.data.idnewserver}\`\n- Membros: \`${ff.qtdpuxados}\`/\`${ff.quantidade}\`\n- Status: \`Em andamento\`\n- Ultima atualização: <t:${Math.floor(Date.now() / 1000)}:R>`, inline: true },
        )

    const embedlogs = new EmbedBuilder()
        .setTitle('Logs de Puxar Membros')
        .setDescription(`O usuário <@!${pullRequest.data.message.user}> fez um pedido de puxar membros, verifique o status abaixo.`)
        .setColor('Yellow')
        .setFields(
            { name: 'Informações:', value: `- Servidor: \`${pullRequest.data.idnewserver}\`\n- Membros: \`${ff.qtdpuxados}\`/\`${ff.quantidade}\`\n- Status: \`Em andamento\`\n- Ultima atualização: <t:${Math.floor(Date.now() / 1000)}:R>`, inline: true },
        )


    let channellog = await client.channels.fetch(pullRequest.data.messagelog.channel)
    let mensagemlog = await channellog.messages.fetch(pullRequest.data.messagelog.id)

    try {


        let channel = await client.channels.fetch(pullRequest.data.message.channel)
        let mensagem = await channel.messages.fetch(pullRequest.data.message.id)

        await mensagem.edit({ embeds: [embed] })
    } catch (error) {

    }
    await mensagemlog.edit({ embeds: [embedlogs] })
}

async function updateRequestStatus(pullRequest, status, client) {
    PullRequest.set(`${pullRequest.ID}.status`, status);



    try {
        const embed = new EmbedBuilder()
            .setTitle('Pedido de Puxar Membros')
            .setDescription(`Olá <@!${pullRequest.data.message.user}>, Sua solicitação foi ${status.toLowerCase()}, verifique o status abaixo.`)
            .setColor(status === 'Concluido Parcialmente' ? 'Purple' : 'Green')
            .setFields(
                { name: 'Informações:', value: `- Servidor: \`${pullRequest.data.idnewserver}\`\n- Membros: \`${PullRequest.get(pullRequest.ID).qtdpuxados}\`/\`${PullRequest.get(pullRequest.ID).quantidade}\`\n- Status: \`${status}\`\n- Ultima atualização: <t:${Math.floor(Date.now() / 1000)}:R>`, inline: true }
            );
        let channel = await client.channels.fetch(pullRequest.data.message.channel);
        let mensagem = await channel.messages.fetch(pullRequest.data.message.id);
        await mensagem.edit({ embeds: [embed] });

    } catch (error) {

    }

    const embedlogs = new EmbedBuilder()
        .setTitle('Logs de Puxar Membros')
        .setDescription(`O usuário <@!${pullRequest.data.message.user}> fez um pedido de puxar membros, verifique o status abaixo.`)
        .setColor(status === 'Concluido Parcialmente' ? 'Purple' : 'Green')
        .setFields(
            { name: 'Informações:', value: `- Servidor: \`${pullRequest.data.idnewserver}\`\n- Membros: \`${PullRequest.get(pullRequest.ID).qtdpuxados}\`/\`${PullRequest.get(pullRequest.ID).quantidade}\`\n- Status: \`${status}\`\n- Ultima atualização: <t:${Math.floor(Date.now() / 1000)}:R>`, inline: true }
        );

    let channellog = await client.channels.fetch(pullRequest.data.messagelog.channel);
    let mensagemlog = await channellog.messages.fetch(pullRequest.data.messagelog.id);
    await mensagemlog.edit({ embeds: [embedlogs] });
}


export {
    PullStartMembers
}