// @ts-nocheck
import { registros, Notify } from "../../database/oauth2/index.ts";
import request from "request";
import axios from "axios";
import querystring from "node:querystring";

function RefreshTokens(client) {
    let dd = registros.fetchAll()
    dd.forEach((element) => {
        let users = element.data.usuarios
        users.forEach(async (user) => {
            if (user.token_expires !== undefined) {
                if (Date.now() >= user.token_expires) {
                    const data = querystring.stringify({
                        client_id: element.data.botid,
                        client_secret: element.data.client_secret,
                        grant_type: "refresh_token",
                        refresh_token: user.refresh_token,
                    });
                    const headers = {
                        "Content-Type": "application/x-www-form-urlencoded",
                    };
                    let response222
                    try {
                        response222 = await axios.post("https://discord.com/api/oauth2/token", data, {
                            headers: headers,
                        });
                    } catch (error) {
                  
                        if (error.response.data.error === 'invalid_client') {
                            if (element.data?.owner?.length > 0) {
                                if (!Notify.get(`${element.data.botid}`)) {
                                    let user = await client.users.fetch(element.data.owner[0])

                                    const msg = `- Olá ${user}, O Client Secret da aplicação <@!${element.data.botid}> está inválido, por favor, realize a troca para melhor funcionamento da aplicação.`

                                    user.send({ content: msg })
                                    Notify.set(`${element.data.botid}`, true)

                                }
                            }
                            return
                        }

                        if (error.response.data.error === 'invalid_grant') {
                            user.access_token = 'unauthorized'
                            user.refresh_token = 'unauthorized'
                            user.token_expires = 'unauthorized'
                            registros.set(`${element.ID}.usuarios`, element.data.usuarios)
                        }
                        return
                    }

                    user.access_token = response222.data.access_token
                    user.refresh_token = response222.data.refresh_token
                    user.token_expires = Date.now() + response222.data.expires_in * 1000

                    registros.set(`${element.ID}.usuarios`, element.data.usuarios)
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
        })
    })

}


function RefreshBio(client) {

    let dd = registros.fetchAll()

    dd.forEach((element) => {
        if (element.data.adicionais.includes("divulgacao")) return;
        request({
            method: "PATCH",
            url: `https://discord.com/api/v9/applications/${element.data.botid}`,
            headers: {
                "Authorization": `Bot ${element.data.token}`,
                "Content-Type": "application/json"
            },
            json: {

                "flags": 8953856,
                "description": `**NubZ Framework\nᐉ https://discord.gg/B6Zub9VbJb**`
            }
        }, (error, response, body) => {
            if (!body) return;
            var json = body;
        })

    })

}

export {
    RefreshTokens,
    RefreshBio
}
