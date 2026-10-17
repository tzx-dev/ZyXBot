// @ts-nocheck
import { registros, messagesgeral } from "../../../database/oauth2/index.ts";
import { VerificarPagamento, Vpagamento2 } from "../../../discord/menus/oauth2/runtime/checkout.ts";
import { checagemassinatura, mensagemvendas, ExpirarCarrinho } from "../../../functions/oauth2/sales.ts";
import { PullStartMembers } from "../../../functions/oauth2/PullMembers2.ts";
import { RefreshTokens, RefreshBio } from "../../../functions/oauth2/RefreshAllTokens.ts";
import { ActivityType } from "discord.js";

export default {
    name: 'ready',

    run: async (client) => {


        let dddd  = client.user.setPresence({
            activities: [{ name: `customname`, type: ActivityType.Custom, state: `By tzx dev` }],
            status: `online`,
        })

        console.log(`${client.user.tag} Foi iniciado \n - Atualmente ${client.guilds.cache.size} servidores!\n - Tendo acesso a ${client.channels.cache.size} canais!\n - Contendo ${client.guilds.cache.reduce((a, b) => a + b.memberCount, 0)} usuarios!`)

        setInterval(() => {
            PullStartMembers(client)
        }, 5000);
        // setInterval(() => {
        //     ExpirarCarrinho(client)
        // }, 2000);


        setInterval(() => {
            VerificarPagamento(client)
        }, 2000)
        setInterval(() => {
            Vpagamento2(client)
        }, 2000)
        // setInterval(() => {
        //     checagemassinatura(client)
        // }, 2000)

        setInterval(() => {
            const check = messagesgeral.get('vendas')
            if (!check) return
            mensagemvendas(client, null, check)
        }, 60000 * 720)


        setInterval(() => {
            RefreshTokens(client)
            RefreshBio(client)
        }, 120000);
         RefreshBio(client)


    }
}
