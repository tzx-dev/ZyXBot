// @ts-nocheck
import { registros, messagesgeral, Licensa } from "../../../../database/oauth2/index.ts";
import { 
    ContainerBuilder, 
    TextDisplayBuilder, 
    MessageFlags 
} from 'discord.js';
import crypto from 'crypto';

export default {
    name: 'interactionCreate',

    run: async (interaction, client) => {

        if (interaction.isButton()) {
            if (interaction.customId === 'GerarAPIToken') {
                const token = messagesgeral.get(interaction.message.id);
                const user = registros.get(token.token);

                function generateHash(data) {
                    const jsonString = JSON.stringify(data);
                    return crypto.createHash('sha256')
                        .update(jsonString)
                        .digest('hex');
                }
                
                function generateSequence(data) {
                    const randomValue = Math.random().toString(36).substring(2, 8);
                    const { botid, token, userid } = data;
                    const hash = generateHash({ token, botid, userid, randomValue });
                    return `${user.owner[0]}-${hash}`;
                }
                
                const inputData = {
                    botid: user.botid,
                    userid: user.owner,
                    registro: token.token
                };
                const result = generateSequence(inputData);

                Licensa.set(token.token, { token: result, registro: token.token });

                const containerToken = new ContainerBuilder()
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(
                            `# \`✅\` ・Token Gerado com Sucesso!\n\n` +
                            `\`\`\`\n${result}\n\`\`\`\n` +
                            `-# \`⚠️\` **Aviso Importante:** Esta mensagem será apagada em **15 segundos**. O token é visível apenas uma vez; caso o perca, gere outro!`
                        )
                    );

                interaction.reply({ 
                    components: [containerToken], 
                    flags: MessageFlags.IsComponentsV2, 
                    ephemeral: true 
                }).then(msg => {
                    setTimeout(async () => {
                        try {
                            await msg.delete();
                        } catch (error) {}
                    }, 15000);
                });
            }
        }

        if (interaction.isAutocomplete()) {
            if (interaction.commandName === 'auth') {

                const produtosEncontrados = registros.filter(registro => registro.data.owner.includes(interaction.user.id));
                const respostas = await Promise.all(produtosEncontrados.map(async produto => {
                    const token = produto.data.token;
                    const request = await fetch('https://discord.com/api/users/@me', {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bot ${token}`,
                            'Content-Type': 'application/json',
                        },
                    });
                
                    const respostaJson = await request.json();
                    let active = null;
                
                    if (respostaJson.message === "401: Unauthorized") {
                        active = `(Desabilitado - Token inválido)`;
                    }
                
                    return {
                        name: `🔖 Nome - ${active === null ? respostaJson.username : active} | 🧱 ID - ${produto.ID.toString().toUpperCase()}`,
                        value: `${produto.ID}`
                    };
                }));
                
                const resposta = respostas.length === 0 ? [{ name: "Nenhum produto registrado foi encontrado", value: "nada" }] : respostas;
                interaction.respond(resposta);

            }
        }
    }
};

