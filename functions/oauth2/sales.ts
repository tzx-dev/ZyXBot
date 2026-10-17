// @ts-nocheck
import { registros, messagesgeral, Carinho } from "../../database/oauth2/index.ts";

async function salesMenu() { return import("../../discord/menus/oauth2/sales.ts"); }
async function expirationMenu() { return import("../../discord/menus/oauth2/subscription-expiration.ts"); }

async function checagemassinatura(client) {
    const Aplicacoes = registros.fetchAll();
    const hoje = Math.floor(Date.now());

    for (const aplicacao in Aplicacoes) {
        const info = Aplicacoes[aplicacao];
        const diasfaltando = Math.floor(((info.data.timestamp - hoje) / (1000 * 60 * 60 * 24)) + 1);
        const owners = info.data.owner;

        await Promise.all(owners.map(async owner => {
            let user = client.users.cache.get(owner);
            if (!user) {
                try {
                    user = await client.users.fetch(owner);
                } catch (error) {}
            }

            const nome = diasfaltando <= 0 ? 'Expirado' : `Dias restantes`;
            let desc = '';
            let statusKey = '';

            if (diasfaltando === 3) {
                if (registros.get(`${info.ID}.status`) === '3dias') return;
                statusKey = '3dias';
                desc = `Olá ${user}, sua assinatura está próxima de expirar!`;
            } else if (diasfaltando === 2) {
                if (registros.get(`${info.ID}.status`) === '2dias') return;
                statusKey = '2dias';
                desc = `Olá ${user}, sua assinatura está próxima de expirar!`;
            } else if (diasfaltando === 1) {
                if (registros.get(`${info.ID}.status`) === '1dia') return;
                statusKey = '1dia';
                desc = `Olá ${user}, sua assinatura está próxima de expirar!`;
            } else if (diasfaltando <= 0) {
                if (registros.get(`${info.ID}.status`) === 'expirado') return;
                statusKey = 'expirado';
                desc = `Olá ${user}, sua assinatura está expirada!`;
                registros.set(`${info.ID}.inativo`, {
                    status: true,
                    data: Date.now()
                });
            } else {
                return;
            }

            registros.set(`${info.ID}.status`, statusKey);

            const { buildOAuth2SubscriptionExpirationContainer } = await expirationMenu();
            const container = buildOAuth2SubscriptionExpirationContainer({ desc, nome, timestamp: info.data.timestamp });

            if (user) {
                user.send({ components: [container], flags: 32768 }).catch(() => {});
            }
        }));
    }
}

async function enviarPainelCompleto(canal, interaction = null) {
    const { buildOAuth2SalesContainer, getOAuth2SalesAttachment } = await salesMenu();
    const container = buildOAuth2SalesContainer();
    const attachment = getOAuth2SalesAttachment();

    const msgPrincipal = await canal.send({ components: [container], files: [attachment], flags: 32768 });

    await messagesgeral.set(`vendas`, {
        msgid: msgPrincipal.id,
        channelid: canal.id,
        serverid: canal.guild.id,
        timestamp: Date.now()
    });

    if (interaction) {
        interaction.reply({ content: `Mensagem enviada com sucesso!`, ephemeral: true }).catch(() => {});
    }
}

async function mensagemvendas(client, interaction, check) {
    if (check) {
        const canal = client.channels.cache.get(check.channelid) || await client.channels.fetch(check.channelid).catch(() => null);
        if (!canal) return;

        const agora = Date.now();
        const vinteEQuatroHoras = 24 * 60 * 60 * 1000;
        const horaPostagem = check.timestamp || 0;

        if (agora - horaPostagem >= vinteEQuatroHoras) {
            if (check.msgid) {
                const oldMsg = await canal.messages.fetch(check.msgid).catch(() => null);
                if (oldMsg) await oldMsg.delete().catch(() => {});
            }

            await enviarPainelCompleto(canal);
        } else {
            if (check.msgid) {
                const messagebot = await canal.messages.fetch(check.msgid).catch(() => null);
                if (messagebot) {
                    const { buildOAuth2SalesContainer } = await salesMenu();
                    const container = buildOAuth2SalesContainer();
                    await messagebot.edit({ 
                        components: [container], 
                        flags: 32768 
                    }).catch(() => {});
                }
            }
        }
    } else {
        if (messagesgeral.has('vendas')) {
            try {
                const checkMsg = messagesgeral.get('vendas');
                const canal = client.channels.cache.get(checkMsg.channelid) || await client.channels.fetch(checkMsg.channelid).catch(() => null);
                if (canal && checkMsg.msgid) {
                    const oldMsg = await canal.messages.fetch(checkMsg.msgid).catch(() => null);
                    if (oldMsg) await oldMsg.delete().catch(() => {});
                }
            } catch (error) {}
        }

        await enviarPainelCompleto(interaction.channel, interaction);
    }
}

function iniciarLoopVendas(client) {
    setInterval(async () => {
        try {
            const check = messagesgeral.get('vendas');
            if (check) {
                await mensagemvendas(client, null, check);
            }
        } catch (error) {
            console.error("Erro no loop de atualização de vendas:", error);
        }
    }, 5000);
}

async function ExpirarCarrinho(client) {
    const Carrinhos = Carinho.fetchAll();

    for (const i in Carrinhos) {
        const element = Carrinhos[i];
        if (!element.data.expirar) return;
        if (element.data.expirar < Date.now()) {
            const canal = await client.channels.cache.get(element.data.channel);
            if (canal) {
                canal.delete().catch(() => {});
                Carinho.delete(element.ID);
            }
        }
        if (element.data.expirar < Date.now() + 60000) {
            if (element.data.notificado) return;
            const canal = await client.channels.cache.get(element.data.channel);
            const umminuto = Math.floor(element.data.expirar / 1000);

            if (canal) {
                await canal.send({ content: `Seu Carrinho está prestes a expirar! <t:${umminuto}:R>` }).then(() => {
                    Carinho.set(`${element.ID}.notificado`, true);
                }).catch(() => {});
            }
        }
    }
}

export {
    checagemassinatura,
    mensagemvendas,
    iniciarLoopVendas,
    ExpirarCarrinho
};
