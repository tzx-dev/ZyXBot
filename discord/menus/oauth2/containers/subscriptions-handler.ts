// @ts-nocheck
import { 
    ActionRowBuilder, 
    AttachmentBuilder, 
    ButtonBuilder, 
    ButtonStyle,
    InteractionType, 
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    MediaGalleryBuilder,
    MediaGalleryItemBuilder,
    MessageFlags
} from 'discord.js';
import { General, messagesgeral, registros } from '../../../../database/oauth2/index.ts';
import mercadopago from 'mercadopago';

export default {
    name: 'interactionCreate',

    run: async (interaction, client) => {

        if (interaction.isButton()) {
            // -- Sistema de Configuração (Seleção de Aplicação) --
            if (interaction.customId === 'configurarOauth2') {
                const aplicacoes = registros.fetchAll();
                const userBots = aplicacoes.filter(app => app.data && app.data.owner && app.data.owner.includes(interaction.user.id));
                
                if (userBots.length === 0) {
                    return interaction.reply({ content: '❌ Você não possui nenhuma aplicação OAuth2 registrada.', ephemeral: true });
                }

                const options = userBots.map(app => {
                    return new StringSelectMenuOptionBuilder()
                        .setLabel(app.data.name || app.ID)
                        .setDescription(`ID da Aplicação: ${app.ID}`)
                        .setValue(app.ID)
                        .setEmoji('<:emoji_10:1544807625164587190>');
                });

                const selectMenu = new StringSelectMenuBuilder()
                    .setCustomId('selectOauth2Config')
                    .setPlaceholder('Selecione uma aplicação para gerenciar...')
                    .addOptions(options);

                const row = new ActionRowBuilder().addComponents(selectMenu);

                const container = new ContainerBuilder()
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(
                            `# \`⚙️\` Configuração do OAuth2\n\n` +
                            `Olá **${interaction.user.globalName}**! Selecione no menu abaixo a aplicação que deseja gerenciar:\n\n` +
                            `- **Gerenciar Tokens & Secret Keys**\n` +
                            `- **Acompanhar Membros & Servidores Vinculados**\n` +
                            `- **Gerenciar Assinatura & Adicionais**`
                        )
                    )
                    .addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing("Small"))
                    .addActionRowComponents(row);

                return interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2, ephemeral: true });
            }

            if (interaction.customId === 'diario') {
                const plano = General.get(`plano_diario`);
                let infos = messagesgeral.get(interaction.message.id);
                let users = registros.get(infos.token);
                let adicional1 = users.adicionais.includes('cooldown') ? `${General.get('adicional_cooldown')}` : 0;
                let adicional2 = users.adicionais.includes('pullmails') ? `${General.get('adicional_pullmails')}` : 0;
                let adicional3 = users.adicionais.includes('divulgacao') ? `${General.get('adicional_divulgacao')}` : 0;

                const valor = Number(plano) + Number(adicional1) + Number(adicional2) + Number(adicional3);
                GerarPagamento(client, interaction, valor, 'Diário');
            }
            if (interaction.customId === 'semanal') {
                const plano = General.get(`plano_semanal`);
                const infos = messagesgeral.get(interaction.message.id);
                const users = registros.get(infos.token);
                const adicional1 = users.adicionais.includes('cooldown') ? `${General.get('adicional_cooldown')}` : 0;
                const adicional2 = users.adicionais.includes('pullmails') ? `${General.get('adicional_pullmails')}` : 0;
                const adicional3 = users.adicionais.includes('divulgacao') ? `${General.get('adicional_divulgacao')}` : 0;

                const valor = Number(plano) + Number(adicional1) + Number(adicional2) + Number(adicional3);
                GerarPagamento(client, interaction, valor, 'Semanal');
            }
            if (interaction.customId === 'mensal') {
                const plano = General.get(`plano_mensal`);
                const infos = messagesgeral.get(interaction.message.id);
                const users = registros.get(infos.token);
                const adicional1 = users.adicionais.includes('cooldown') ? `${General.get('adicional_cooldown')}` : 0;
                const adicional2 = users.adicionais.includes('pullmails') ? `${General.get('adicional_pullmails')}` : 0;
                const adicional3 = users.adicionais.includes('divulgacao') ? `${General.get('adicional_divulgacao')}` : 0;

                const valor = Number(plano) + Number(adicional1) + Number(adicional2) + Number(adicional3);
                GerarPagamento(client, interaction, valor, 'Mensal');
            }
            if (interaction.customId === 'copiarecolar') {
                const pix = messagesgeral.get(`${interaction.message.id}.pagamentos.pixcopiaecola`);
                interaction.reply({ content: `${pix}`, ephemeral: true });
            }
            if (interaction.customId.startsWith('adquirir-')) {
                const plano = General.get(`adicional_${interaction.customId.split('-')[1]}`);
                const infos = messagesgeral.get(interaction.message.id);

                GerarPagamento(client, interaction, plano, interaction.customId.split('-')[1]);
            }
        }

        // -- Menu Select Handler (Configurações Gerais do OAuth2) --
        if (interaction.isStringSelectMenu() && interaction.customId === 'selectOauth2Config') {
            const tokeninicial = interaction.values[0];
            let asasasas = registros.get(tokeninicial);

            if (!asasasas) return interaction.update({ content: 'Aplicação não encontrada no banco de dados.', components: [] });

            messagesgeral.set(interaction.message.id, { id: interaction.message.id, user: interaction.user.id, token: tokeninicial });

            const request = await fetch('https://discord.com/api/users/@me', {
                method: 'GET',
                headers: {
                    'Authorization': `Bot ${asasasas.token}`,
                    'Content-Type': 'application/json',
                },
            });

            let dsdsds = await request.json();
            let active = dsdsds.code === 0 ? 1 : 0;
            
            let hora = new Date().getHours();
            let saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';
            const usuariosUnicos = new Set();

            if (asasasas.usuarios) {
                asasasas.usuarios.forEach(usuario => {
                    if (usuario.access_token !== 'unauthorized') {
                        usuariosUnicos.add(usuario.userid);
                    }
                });
            }
            const membrosOAuth2 = usuariosUnicos.size || '0';
            const token = (asasasas.token).substring(0, 15) + '...';
            const data = `<t:${Math.floor(asasasas.timestamp / 1000)}:R>`;

            let adicional1 = asasasas.adicionais && asasasas.adicionais.includes('cooldown') ? `✅ CoolDown - ${Number(General.get('adicional_cooldown')).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}` : `❌ CoolDown - ${Number(General.get('adicional_cooldown')).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;
            let adicional2 = asasasas.adicionais && asasasas.adicionais.includes('pullmails') ? `✅ Pull Email's - ${Number(General.get('adicional_pullmails')).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}` : `❌ Pull Email's - ${Number(General.get('adicional_pullmails')).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;
            let adicional3 = asasasas.adicionais && asasasas.adicionais.includes('divulgacao') ? `✅ Remov. Divulgação - ${Number(General.get('adicional_divulgacao')).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}` : `❌ Remov. Divulgação - ${Number(General.get('adicional_divulgacao')).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;

            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `# Configurações do seu OAuth2 | ${dsdsds.username == undefined ? 'Desconhecido' : dsdsds.username}\n\n` +
                        `- ${saudacao} senhor(a) **${interaction.user.globalName}**, como posso lhe ajudar?\n\n` +
                        `**Token da Aplicação:** \`${active == 1 ? 'Token Inválido' : token}\` | **Client Secret:** \`${(asasasas.client_secret).substring(0, 15) + '...'}\` | **Expira em:** ${data}\n\n` +
                        `### Adicionais Disponíveis\n- \`${adicional1}\`\n- \`${adicional2}\`\n- \`${adicional3}\`\n\n` +
                        `### Informações\n- \`Membros OAuth2: ${membrosOAuth2}\`\n- \`Aplicação: ${dsdsds.username == undefined ? 'Desconhecido' : dsdsds.username}\`\n- \`S. Principal: ${asasasas?.principalserver?.name == undefined ? 'Não definido' : asasasas?.principalserver?.name}\`` +
                        (asasasas.inativo ? `\n\n**Aviso:**\nSeu bot está inativo, para reativá-lo, realize o pagamento da sua assinatura!` : '')
                    )
                )
                .addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing("Small"));

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('recuperarmembros')
                    .setLabel('Recuperar Membros')
                    .setEmoji('<:emoji:1544020146031562753>')
                    .setDisabled(asasasas.inativo ? true : false)
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('pullmails')
                    .setLabel('Puxar Emails')
                    .setEmoji('<:emoji:1544020533509881948>')
                    .setDisabled(asasasas.inativo || !(asasasas.adicionais && asasasas.adicionais.includes('pullmails')) ? true : false)
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setURL(`https://discord.com/oauth2/authorize?client_id=${dsdsds.id}&scope=bot&permissions=8`)
                    .setLabel('Adicionar Aplicação')
                    .setDisabled(asasasas.inativo ? true : false)
                    .setStyle(ButtonStyle.Link)
            );

            const row2 = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('gerenciarservidores')
                    .setLabel('Geren. Servidores')
                    .setEmoji('<:emoji:1544020531135774720>')
                    .setDisabled(false)
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('gerenciarassinatura')
                    .setLabel('Geren. Assinatura')
                    .setEmoji('<:sla:1544020897499975851>')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('gerenciarbot')
                    .setLabel('Geren. Aplicação')
                    .setEmoji('<:sla:1544020893737426954>')
                    .setDisabled(asasasas.inativo ? true : false)
                    .setStyle(ButtonStyle.Secondary)
            );

            container.addActionRowComponents(row, row2);

            return interaction.update({ components: [container], flags: MessageFlags.IsComponentsV2 });
        }
    }
};

async function GerarPagamento(client, interaction, valor, tipo) {

    interaction.update({ content: `🔄️ Gerando pagamento...`, components: [], embeds: [], ephemeral: true });
    messagesgeral.set(`${interaction.message.id}.valor`, Number(valor));
    messagesgeral.set(`${interaction.message.id}.tipo`, tipo);
    messagesgeral.set(`${interaction.message.id}.server`, interaction.guild.id);

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
    };
    mercadopago.configurations.setAccessToken(General.get('tokenmp'));
    await mercadopago.payment.create(payment_data)
        .then(async function (data) {
            await messagesgeral.set(`${interaction.message.id}.message`, { webhookID: interaction.token, applicationid: interaction.applicationId, msgid: interaction.message.id, channelid: interaction.channel.id });
            await messagesgeral.set(`${interaction.message.id}.pagamentos`, { type: 'pix', id: data.body.id, QrCode: data.body.point_of_interaction.transaction_data.qr_code_base64, pixcopiaecola: data.body.point_of_interaction.transaction_data.qr_code });
        }).catch(function (error) {
            console.log('Error Pagamento', error);
        });

    var t = messagesgeral.get(`${interaction.message.id}`);

    const buffer = Buffer.from(t.pagamentos.QrCode, "base64");
    const attachment = new AttachmentBuilder(buffer, { name: "payment.png" });

    const container = new ContainerBuilder()
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`## Pagamento via Pix criado\n**Comprador:** ${interaction.user.username}\n\n**Código copia e cola:**\n\`\`\`${t.pagamentos.pixcopiaecola}\`\`\`\n*${interaction.guild.name} - Pagamento expira em 10 min*`)
        )
        .addMediaGalleryComponents(
            new MediaGalleryBuilder().addItems(
                new MediaGalleryItemBuilder().setURL("attachment://payment.png")
            )
        );

    const botao = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('copiarecolar')
            .setLabel('Copiar e Colar')
            .setStyle(2)
            .setEmoji('1233200554252042260'),
    );

    interaction.editReply({ content: '', components: [container, botao], files: [attachment], flags: MessageFlags.IsComponentsV2, ephemeral: true });
}

