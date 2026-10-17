// @ts-nocheck
import { ActionRowBuilder, EmbedBuilder, ButtonBuilder, InteractionType, ChannelType, PermissionsBitField, RoleSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ChannelSelectMenuBuilder, AttachmentBuilder, StringSelectMenuOptionBuilder, StringSelectMenuBuilder } from 'discord.js';
import { Carinho, General, registros, messagesgeral } from '../../../database/oauth2/index.ts';
import { gerenciarservidores, primeirapg, gerenciarassinatura, gerenciarbot, renovarassinatura, adquiriradicionais } from '../../../discord/menus/oauth2/runtime/application.ts';
import mercadopago from 'mercadopago';
import axios from 'axios';

export default {
    name: 'interactionCreate',

    run: async (interaction, client) => {

        if (interaction.isStringSelectMenu()) {
            if (interaction.customId == 'adicionais') {

                let adicional = interaction.values[0]
                if (adicional == 'adicional_pullmails') {
                    adicional = 'pullmails'
                } else if (adicional == 'adicional_cooldown') {
                    adicional = 'cooldown'
                } else if (adicional == 'adicional_divulgacao') {
                    adicional = 'divulgacao'
                }

                if (Carinho.get(`${interaction.channel.id}.adicional.${adicional}`)) {
                    Carinho.set(`${interaction.channel.id}.adicional.${adicional}`, false);
                } else {
                    Carinho.set(`${interaction.channel.id}.adicional.${adicional}`, true);
                }

                let carrinho = Carinho.get(interaction.channel.id)

                let valoradicional = 0

                if (carrinho.adicional.pullmails) {
                    valoradicional = valoradicional + Number(General.get('adicional_pullmails'))
                }
                if (carrinho.adicional.cooldown) {
                    valoradicional = valoradicional + Number(General.get('adicional_cooldown'))
                }
                if (carrinho.adicional.divulgacao) {
                    valoradicional = valoradicional + Number(General.get('adicional_divulgacao'))
                }




                const select = new ActionRowBuilder().addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId('adicionais')
                        .setPlaceholder('⭐ Adicionais disponíveis')
                        .addOptions(
                            new StringSelectMenuOptionBuilder()
                                .setLabel(`PullMails (${carrinho.adicional.pullmails ? 'Ativado' : 'Desativado'})`)
                                .setValue('adicional_pullmails')
                                .setDescription('Com o PullMails você pode receber os e-mails de seus usuários diretamente no seu bot.'),
                            new StringSelectMenuOptionBuilder()
                                .setLabel(`CoolDown (${carrinho.adicional.cooldown ? 'Ativado' : 'Desativado'})`)
                                .setValue('adicional_cooldown')
                                .setDescription('Retire o cooldown da recuperação de membros'),
                            new StringSelectMenuOptionBuilder()
                                .setLabel(`Divulgação (${carrinho.adicional.divulgacao ? 'Ativado' : 'Desativado'})`)
                                .setValue('adicional_divulgacao')
                                .setDescription('Retire a divulgação do bot')
                        )
                )

                const botao = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('comprar_diario')
                        .setLabel('Diário (1 dia)')
                        .setStyle(2),
                    new ButtonBuilder()
                        .setCustomId('comprar_semanal')
                        .setLabel('Semanal (7 dias)')
                        .setStyle(2),
                    new ButtonBuilder()
                        .setCustomId('comprar_mensal')
                        .setLabel('Mensal (30 dias)')
                        .setStyle(2),
                    new ButtonBuilder()
                        .setCustomId('cancelarinicio')
                        .setEmoji('1229787813046915092')
                        .setStyle(4)
                )

                await interaction.message.edit({ content: `- Olá ${interaction.user}, bem-vindo ao seu carrinho de compras. Confira os valores do plano OAuth2 e finalize sua compra com facilidade.\n - Diário: \`${Number(General.get('plano_diario') + valoradicional).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}\`\n - Semanal: \`${Number(General.get('plano_semanal') + valoradicional).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}\`\n - Mensal: \`${Number(General.get('plano_mensal') + valoradicional).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}\``, components: [botao, select] });
                interaction.deferUpdate()
            }

        }

        if (interaction.isButton()) {


            if (interaction.customId === 'comprar') {
                await interaction.reply({ content: `🔄️ Carregando...`, ephemeral: true })

                const carrinhocriado = await interaction.channel.threads.cache.find(channel => channel.name === `🛒・${interaction.user.username}`)

                if (carrinhocriado) {
                    const canal = new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setURL(carrinhocriado.url)
                            .setLabel('Ir para o carrinho')
                            .setEmoji('1233118589763195004')
                            .setStyle(5),
                    )

                    return interaction.editReply({ content: `🛒 Você já possui um carrinho aberto!`, components: [canal], ephemeral: true })
                }
                const carrinho = await interaction.channel.threads.create({
                    name: `🛒・${interaction.user.username}`,
                    type: ChannelType.PrivateThread,
                    reason: 'Needed a separate thread for food',
                })

                const expirarcarrinho = Date.now() + 10 * 60000

                const carrinhoaberto = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setURL(carrinho.url)
                        .setLabel('Ir para o Carrinho')
                        .setEmoji('1233118589763195004')
                        .setStyle(5)
                )

                Carinho.set(carrinho.id, { user: interaction.user.id, channel: carrinho.id, expirar: expirarcarrinho })

                const botao = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('comprar_diario')
                        .setLabel('Diário (1 dia)')
                        .setStyle(2),
                    new ButtonBuilder()
                        .setCustomId('comprar_semanal')
                        .setLabel('Semanal (7 dias)')
                        .setStyle(2),
                    new ButtonBuilder()
                        .setCustomId('comprar_mensal')
                        .setLabel('Mensal (30 dias)')
                        .setStyle(2),
                    new ButtonBuilder()
                        .setCustomId('cancelarinicio')
                        .setEmoji('1229787813046915092')
                        .setStyle(4)
                )

                const select = new ActionRowBuilder().addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId('adicionais')
                        .setPlaceholder('⭐ Adicionais disponíveis')
                        .addOptions(
                            new StringSelectMenuOptionBuilder()
                                .setLabel('PullMails (Desativado)')
                                .setValue('adicional_pullmails')
                                .setDescription('Com o PullMails você pode receber os e-mails de seus usuários diretamente no seu bot.'),
                            new StringSelectMenuOptionBuilder()
                                .setLabel('CoolDown (Desativado)')
                                .setValue('adicional_cooldown')
                                .setDescription('Retire o cooldown da recuperação de membros'),
                            new StringSelectMenuOptionBuilder()
                                .setLabel('Divulgação (Desativado)')
                                .setValue('adicional_divulgacao')
                                .setDescription('Retire a divulgação do bot')
                        )
                )



                await carrinho.send({ content: `- Olá ${interaction.user}, bem-vindo ao seu carrinho de compras. Confira os valores do plano OAuth2 e finalize sua compra com facilidade.\n - Diário: \`${Number(General.get('plano_diario')).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}\`\n - Semanal: \`${Number(General.get('plano_semanal')).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}\`\n - Mensal: \`${Number(General.get('plano_mensal')).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}\``, components: [botao, select] });
                interaction.editReply({ content: `Carrinho aberto!`, components: [carrinhoaberto], ephemeral: true });
            }
            if (interaction.customId === 'cancelarinicio') {
                Carinho.delete(interaction.channelId)
                interaction.channel.delete()
            }
            if (interaction.customId.startsWith('comprar_')) {
                const plano = interaction.customId.split('_')[1]

                let valoradicional = 0
                let carrinho = Carinho.get(interaction.channel.id)

                if (carrinho.adicional?.pullmails) {
                    valoradicional = valoradicional + Number(General.get('adicional_pullmails'))
                }
                if (carrinho.adicional?.cooldown) {
                    valoradicional = valoradicional + Number(General.get('adicional_cooldown'))
                }
                if (carrinho.adicional?.divulgacao) {
                    valoradicional = valoradicional + Number(General.get('adicional_divulgacao'))
                }

                const valor = General.get(`plano_${plano}`) + valoradicional

                const expirarcarrinho = Date.now() + 10 * 60000
                Carinho.set(`${interaction.channel.id}.expirar`, expirarcarrinho)
                PagamentoAssinatura(client, interaction, valor, plano)
            }
            if (interaction.customId.startsWith('enviarbot_')) {
                const id = interaction.customId.split('_')[1]

                const modal = new ModalBuilder()
                    .setTitle('Enviar BOT')
                    .setCustomId(`enviarbot_${id}`)

                const token = new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('token')
                        .setLabel(`Informe abaixo o token do BOT`)
                        .setStyle(TextInputStyle.Short)
                )

                const client_secret = new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('client_secret')
                        .setLabel(`Informe abaixo o client_secret do BOT`)
                        .setStyle(TextInputStyle.Short)
                )

                modal.addComponents(token, client_secret)
                await interaction.showModal(modal)
            }
            if (interaction.customId === 'copiarcolarpix') {
                const pix = Carinho.get(`${interaction.channel.id}.pagamentos.pixcopiaecola`)
                interaction.reply({ content: `${pix}`, ephemeral: true })
            }
        }
        if (interaction.type == InteractionType.ModalSubmit) {
            if (interaction.customId.startsWith('enviarbot_')) {
                await interaction.reply({ content: `🔄️ Enviando...`, ephemeral: true })
                const id = interaction.customId.split('_')[1]
                const bot = messagesgeral.get(`${id}`)
                const token = interaction.fields.getTextInputValue('token')
                const client_secret = interaction.fields.getTextInputValue('client_secret')

                const request = await fetch('https://discord.com/api/users/@me', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bot ${token}`,
                        'Content-Type': 'application/json',
                    },
                })

                const botregistrar = await request.json()
                if (botregistrar.message === '401: Unauthorized') {
                    return interaction.editReply({ content: 'Token inválido, tente novamente com outro.', ephemeral: true })
                }

                const API_ENDPOINT = 'https://discord.com/api/v10';
                const CLIENT_ID = botregistrar.id
                const CLIENT_SECRET = client_secret

                const data = new URLSearchParams();
                data.append('grant_type', 'client_credentials');
                data.append('scope', 'identify connections');

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
                    const tipo = messagesgeral.get(`${id}.tipo`)

                    const tiposParaExpiracao = {
                        'diario': 1 * 24 * 60 * 60 * 1000,
                        'semanal': 7 * 24 * 60 * 60 * 1000,
                        'mensal': 30 * 24 * 60 * 60 * 1000
                    }

                    const expiracao = Date.now() + tiposParaExpiracao[tipo]

                    await registros.set(`${id}`, {
                        adicionais: bot.adicional,
                        client_secret: client_secret,
                        owner: [interaction.user.id],
                        token: token,
                        timestamp: expiracao,
                        botid: botregistrar.id,
                        usuarios: []
                    })

                    const infobot = registros.get(`${id}`)

                    let adicional1 = infobot.adicionais.includes('cooldown') ? `✅ CoolDown` : `❌ CoolDown`
                    let adicional2 = infobot.adicionais.includes('pullmails') ? `✅ Pull Email's` : `❌ Pull Email's`
                    let adicional3 = infobot.adicionais.includes('divulgacao') ? `✅ Remov. Divulgação` : `❌ Remov. Divulgação`

                    canallogs = client.channels.cache.get(General.get('carrinhologs'))

                    const embed = new EmbedBuilder()
                        .setAuthor({ name: `Novo BOT registrado` })
                        .setColor("#2f3136")
                        .setDescription(`- Veja as informações do BOT abaixo:`)
                        .setFields(
                            { name: `Informações Pagamento:`, value: `- **Usuário:**\n - Nome: ${interaction.user}\n - ID: \`${interaction.user.id}\`\n- **Pagamento:**\n - Plano: \`${tipo}\`\n - Valor: \`Não definido\`\n- **Adicionais:**\n - \`${adicional1}\`\n - \`${adicional2}\`\n - \`${adicional3}\``, inline: true },
                            { name: `Informações BOT:`, value: `- **BOT:**\n - Nome: \`${botregistrar.username}\`\n - ID: \`${botregistrar.id}\`\n- **Token:**\n - ||\`${token}\`||\n- **Client Secret:**\n - ||\`${client_secret}\`||`, inline: true },
                        )
                        .setFooter({ text: `© Todos os direitos reservados a promisse.app` })
                        .setTimestamp()


                    canallogs.send({ embeds: [embed] })


                    interaction.editReply({ content: `# ENTREGA CONCLUIDA! \nVá até o canal https://discord.com/channels/1160704796458745876/1161694479355498609 e execute o comando /auth para administrar seu bot!`, ephemeral: true })
                    interaction.message.delete()
                    setTimeout(async () => {
                        try {
                            await interaction.channel.delete()
                        } catch (error) {

                        }

                    }, 10000);
                }).catch(async error => {
                    console.log('Error Client Secret', error.request.data)
                    return interaction.editReply({ content: `Client Secret inválido, tente novamente com outro.`, ephemeral: true })
                });
            }
        }
    }
}

async function PagamentoAssinatura(client, interaction, valor, tipo) {

    interaction.update({ content: `🔄️ Gerando pagamento...`, components: [], embeds: [], ephemeral: true })
    Carinho.set(`${interaction.channel.id}.valor`, Number(valor))
    Carinho.set(`${interaction.channel.id}.tipo`, tipo)
    Carinho.set(`${interaction.channel.id}.server`, interaction.guild.id)

    var payment_data = {
        transaction_amount: valor,
        description: `${tipo} | ${interaction.user.username}`,
        payment_method_id: 'pix',
        payer: {
            email: `${interaction.user.username}@gmail.com`,
            first_name: `Victor André`,
            last_name: `Ricardo Almeida`,
            identification: {
                type: 'CPF',
                number: '15084299872'
            },

            address: {
                zip_code: '86063190',
                street_name: 'Rua Jácomo Piccinin',
                street_number: '971',
                neighborhood: 'Pinheiros',
                city: 'Londrina',
                federal_unit: 'PR'
            }
        }
    }
    mercadopago.configurations.setAccessToken(General.get('tokenmp'));
    await mercadopago.payment.create(payment_data)
        .then(async function (data) {
            await Carinho.set(`${interaction.channel.id}.message`, { webhookID: interaction.token, applicationid: interaction.applicationId, msgid: interaction.message.id, channelid: interaction.channel.id })
            await Carinho.set(`${interaction.channel.id}.pagamentos`, { type: 'pix', id: data.body.id, QrCode: data.body.point_of_interaction.transaction_data.qr_code_base64, pixcopiaecola: data.body.point_of_interaction.transaction_data.qr_code })
        }).catch(function (error) {
            console.log(error)
        });

    var t = Carinho.get(`${interaction.channel.id}`)

    const buffer = Buffer.from(t.pagamentos.QrCode, "base64");
    const attachment = new AttachmentBuilder(buffer, { name: "payment.png" });

    const embed = new EmbedBuilder()
        .setAuthor({ name: `${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
        .setColor("#2f3136")
        .setTitle(`Pagamento via Pix criado`)
        .setFields(
            { name: `Código copia e cola`, value: `\`\`\`${t.pagamentos.pixcopiaecola}\`\`\``, inline: true },
        )
        .setFooter({ text: `${interaction.guild.name} - Pagamento expira em 10 min` })
        .setTimestamp()
        .setImage(`attachment://payment.png`)

    const botao = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('copiarcolarpix')
            .setLabel('Copiar e Colar')
            .setStyle(2)
            .setEmoji('1233200554252042260'),
    )

    interaction.editReply({ content: '', embeds: [embed], files: [attachment], components: [botao], ephemeral: true })

}
