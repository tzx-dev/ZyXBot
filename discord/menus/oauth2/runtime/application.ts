// @ts-nocheck
import { 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    StringSelectMenuBuilder, 
    StringSelectMenuOptionBuilder, 
    ContainerBuilder, 
    TextDisplayBuilder, 
    SeparatorBuilder, 
    MessageFlags 
} from 'discord.js';
import { registros, messagesgeral, configuracoes, General } from '../../../../database/oauth2/index.ts';
import axios from 'axios';

let joaozinhodelay = {};

async function primeirapg(client, interaction, a, valor) {
    let asasasas = registros.get(valor);

    if (!asasasas) return interaction.reply({ content: '❌ Aplicação não encontrada.', ephemeral: true });

    const token = (asasasas.token).substring(0, 15) + '...';
    const data = `<t:${Math.floor(asasasas.timestamp / 1000)}:R>`;

    let adicional1 = asasasas.adicionais && asasasas.adicionais.includes('cooldown') ? `✅ CoolDown - ${Number(General.get('adicional_cooldown')).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}` : `❌ CoolDown - ${Number(General.get('adicional_cooldown')).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;
    let adicional2 = asasasas.adicionais && asasasas.adicionais.includes('pullmails') ? `✅ Pull Email's - ${Number(General.get('adicional_pullmails')).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}` : `❌ Pull Email's - ${Number(General.get('adicional_pullmails')).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;
    let adicional3 = asasasas.adicionais && asasasas.adicionais.includes('divulgacao') ? `✅ Remov. Divulgação - ${Number(General.get('adicional_divulgacao')).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}` : `❌ Remov. Divulgação - ${Number(General.get('adicional_divulgacao')).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;

    const request = await fetch('https://discord.com/api/users/@me', {
        method: 'GET',
        headers: {
            'Authorization': `Bot ${asasasas.token}`,
            'Content-Type': 'application/json',
        },
    });

    let dsdsds = await request.json();
    let active = dsdsds.code == 0 ? 1 : 0;

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

    if (a != 1) {
        await interaction.reply({ components: [container], flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2, fetchReply: true });
        let message = await interaction.fetchReply();
        messagesgeral.set(message.id, { id: message.id, user: interaction.user.id, token: valor });
    } else {
        await interaction.update({ components: [container], flags: MessageFlags.IsComponentsV2 });
    }
}

async function gerenciarbot(client, interaction, a) {
    let infos = messagesgeral.get(interaction.message.id);
    let users = registros.get(infos.token);

    const request = await fetch('https://discord.com/api/users/@me', {
        method: 'GET',
        headers: {
            'Authorization': `Bot ${users.token}`,
            'Content-Type': 'application/json',
        },
    });

    const dsdsds = await request.json();

    const selectmenu = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('selectmenu')
            .setPlaceholder('Edite seu bot aqui')
            .addOptions(
                new StringSelectMenuOptionBuilder()
                    .setLabel('Nome da Aplicação')
                    .setValue('nomeaplicacao')
                    .setDescription('Edite o nome da aplicação')
                    .setEmoji('1233103066975309984'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('Token da Aplicação')
                    .setValue('tokenaplicacao')
                    .setDescription('Edite o token da aplicação')
                    .setEmoji('1233103066975309984'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('Client Secret')
                    .setValue('clientsecret')
                    .setDescription('Edite o client secret')
                    .setEmoji('1233103066975309984'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('Página Inicial')
                    .setValue('voltarprimeirapg')
                    .setDescription('Voltar para a página inicial')
                    .setEmoji('1106069998331514930')
            )
    );

    const botao = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('GerarAPIToken')
            .setLabel('Gerar API (Token)')
            .setEmoji('1232782650385629299')
            .setStyle(ButtonStyle.Secondary)
    );

    const container = new ContainerBuilder()
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                `# Gerenciamento da Aplicação | ${dsdsds.username}\n\n` +
                `- Aqui você pode gerenciar a aplicação vinculada ao seu OAuth2.\n\n` +
                `**Nome da Aplicação:** \`${dsdsds.username}\`\n` +
                `**Token da Aplicação:** \`${users.token.substring(0, 15) + '...'}\`\n` +
                `**Client Secret:** \`${users.client_secret.substring(0, 15) + '...'}\`\n\n` +
                `**Informações Importante:**\n` +
                `- Ao trocar o token da aplicação, use apenas o token do mesmo bot. Se usar um token diferente, a aplicação será desvinculada do OAuth2, levando à perda de configurações e membros associados.`
            )
        )
        .addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing("Small"))
        .addActionRowComponents(selectmenu, botao);

    if (a != 1) {
        await interaction.update({ components: [container], flags: MessageFlags.IsComponentsV2 });
    } else {
        await interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    }
}

async function gerenciarservidores(client, interaction, page) {
    if (joaozinhodelay[interaction.user.id] && joaozinhodelay[interaction.user.id] > Date.now()) {
        const delayContainer = new ContainerBuilder().addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`⏱️ Aguarde <t:${Math.floor(joaozinhodelay[interaction.user.id]/ 1000)}:R> para realizar uma nova ação.`)
        );
        return await interaction.reply({ components: [delayContainer], flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2 });
    }

    joaozinhodelay[interaction.user.id] = Date.now() + 15000;

    const loadingContainer = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent('-# Carregando...')
    );
    await interaction.update({ components: [loadingContainer], flags: MessageFlags.IsComponentsV2 });

    let infos = messagesgeral.get(interaction.message.id);
    let users = registros.get(infos.token);

    const request = await fetch('https://discord.com/api/users/@me', {
        method: 'GET',
        headers: {
            'Authorization': `Bot ${users.token}`,
            'Content-Type': 'application/json',
        },
    });

    const dsdsds = await request.json();

    const response = await axios.get('https://discord.com/api/v10/users/@me/guilds', {
        headers: {
            Authorization: `Bot ${users.token}`,
        },
    });
    const guilds = response.data;

    let options = [];
    const allUserIds = new Set();

    for (const guild of guilds) {
        const usuariosDoServidor = (users.usuarios || []).filter(usuario => {
            return usuario.serverid && usuario.serverid.some(server => server.idserver === guild.id) && usuario.access_token !== 'unauthorized';
        });
        usuariosDoServidor.forEach(usuario => {
            usuario.serverid = usuario.serverid.filter(id => id.idserver !== guild.id);
        });

        allUserIds.add(guild.id);

        options.push({
            label: `${guild.name}`,
            emoji: '1226700825565593683',
            description: `Membros OAuth2: ${usuariosDoServidor.length}`,
            value: `${guild.id}_${guild.name}`,
        });
    }

    const usuariosForaDosServidores = (users.usuarios || []).filter(usuario => {
        return !allUserIds.has(usuario.serverid) && usuario.access_token !== 'unauthorized';
    });
    const contagemUsuariosPorServidor = {};

    usuariosForaDosServidores.forEach(usuario => {
        if (Array.isArray(usuario.serverid)) {
            usuario.serverid.forEach(id => {
                if (!contagemUsuariosPorServidor[id.idserver || id]) {
                    contagemUsuariosPorServidor[id.idserver || id] = {
                        count: 1,
                        servername: id.servername || 'Servidor'
                    };
                } else {
                    contagemUsuariosPorServidor[id.idserver || id].count++;
                }
            });
        }
    });

    for (const [serverid, { count, servername }] of Object.entries(contagemUsuariosPorServidor)) {
        options.push({
            label: `${servername} (DESVINCULADO)`,
            emoji: '1226700884025802802',
            description: `Membro OAuth2: ${count}`,
            value: `${serverid}_${servername}_off`,
        });
    }

    if (options.length == 0) {
        const emptyContainer = new ContainerBuilder().addTextDisplayComponents(
            new TextDisplayBuilder().setContent('-# `❌` Essa aplicação não está em nenhum servidor ou não há membros autenticados.')
        );
        return await interaction.editReply({ components: [emptyContainer], flags: MessageFlags.IsComponentsV2 });
    }

    if (page == undefined) page = 1;
    const pageSize = 10;
    const totalPages = Math.ceil(options.length / pageSize);
    const startIdx = (page - 1) * pageSize;
    const endIdx = startIdx + pageSize;

    const currentPage = options.slice(startIdx, endIdx);

    const select = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId(`servidores_${page}`)
            .setPlaceholder('Selecione um servidor')
            .addOptions(currentPage)
    );

    const botao = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('pganterior')
            .setLabel('Anterior')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(page == 1 ? true : false),
        new ButtonBuilder()
            .setCustomId('pagina')
            .setLabel(`${page}/${totalPages}`)
            .setDisabled(true)
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId('pgseguinte')
            .setLabel('Seguinte')
            .setDisabled(page == totalPages ? true : false)
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId('voltar_primeirapg')
            .setLabel('Voltar')
            .setEmoji('1106069998331514930')
            .setStyle(ButtonStyle.Secondary)
    );

    messagesgeral.set(`${interaction.message.id}.page`, { page: page, totalPages: totalPages });

    const container = new ContainerBuilder()
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                `# Gerenciamento de Servidores | ${dsdsds.username}\n\n` +
                `- Aqui você pode gerenciar os servidores vinculados ao seu OAuth2.`
            )
        )
        .addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing("Small"))
        .addActionRowComponents(select, botao);

    await interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 });
}

async function gerenciarassinatura(client, interaction) {
    let infos = messagesgeral.get(interaction.message.id);
    let users = registros.get(infos.token);

    const request = await fetch('https://discord.com/api/users/@me', {
        method: 'GET',
        headers: {
            'Authorization': `Bot ${users.token}`,
            'Content-Type': 'application/json',
        },
    });

    const dsdsds = await request.json();

    let adicional1 = users.adicionais && users.adicionais.includes('cooldown') ? `- \`✅ Cooldown - ${Number(General.get('adicional_cooldown')).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}\`` : null;
    let adicional2 = users.adicionais && users.adicionais.includes('pullmails') ? `- \`✅ Pull Email's - ${Number(General.get('adicional_pullmails')).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}\`` : null;
    let adicional3 = users.adicionais && users.adicionais.includes('divulgacao') ? `- \`✅ Divulgação - ${Number(General.get('adicional_divulgacao')).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}\`` : null;

    let mensagem = "";
    if (adicional1 !== null) mensagem += adicional1 + "\n";
    if (adicional2 !== null) mensagem += adicional2 + "\n";
    if (adicional3 !== null) mensagem += adicional3 + "\n";

    mensagem = mensagem.trimEnd();
    const data = `<t:${Math.floor(users.timestamp / 1000)}:D> (<t:${Math.floor(users.timestamp / 1000)}:R>)`;

    const container = new ContainerBuilder()
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                `# Gerenciamento de Adicionais | ${dsdsds.username}\n\n` +
                `- Aqui você pode gerenciar a assinatura do seu OAuth2.\n\n` +
                `**Expira em:** ${data}\n\n` +
                `**Adicionais Ativos:**\n${mensagem == '' ? 'Nenhum adicional adquirido!' : mensagem}`
            )
        )
        .addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing("Small"));

    const botao = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('renovarassinatura')
            .setLabel('Renovar Assinatura')
            .setDisabled(true)
            .setEmoji('1233103068942569543')
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId('adquiriradicionais')
            .setLabel('Adquirir Adicionais')
            .setEmoji('1234653175617687704')
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId('voltar_primeirapg')
            .setLabel('Voltar')
            .setEmoji('1106069998331514930')
            .setStyle(ButtonStyle.Secondary)
    );

    container.addActionRowComponents(botao);

    await interaction.update({ components: [container], flags: MessageFlags.IsComponentsV2 });
}

async function adquiriradicionais(client, interaction) {
    let infos = messagesgeral.get(interaction.message.id);
    let users = registros.get(infos.token);

    const request = await fetch('https://discord.com/api/users/@me', {
        method: 'GET',
        headers: {
            'Authorization': `Bot ${users.token}`,
            'Content-Type': 'application/json',
        },
    });

    const dsdsds = await request.json();

    let adicional1 = users.adicionais && users.adicionais.includes('cooldown') ? `\`✅\`` : `\`❌\``;
    let adicional2 = users.adicionais && users.adicionais.includes('pullmails') ? `\`✅\`` : `\`❌\``;
    let adicional3 = users.adicionais && users.adicionais.includes('divulgacao') ? `\`✅\`` : `\`❌\``;

    const container = new ContainerBuilder()
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                `# Gerenciamento de Adicionais | ${dsdsds.username}\n\n` +
                `- Aqui você pode adquirir os adicionais disponíveis para o seu OAuth2.\n\n` +
                `### Sistema de CoolDown ${adicional1}\n- Otimize sua recuperação de membros com o sistema de CoolDown! Este adicional elimina o tempo de espera, permitindo que você recupere seus membros instantaneamente.\n\n` +
                `### Sistema de PullEmail's ${adicional2}\n- Aproveite o sistema de Email para capturar os endereços de email dos membros autenticados em seu servidor. Com essa informação valiosa, você poderá planejar projetos e se comunicar de forma mais eficaz.\n\n` +
                `### Sistema de Divulgação ${adicional3}\n- Ao adquirir este adicional, a divulgação automática do nosso servidor é removida, liberando espaço para que os usuários promovam seus próprios conteúdos de forma personalizada.`
            )
        )
        .addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing("Small"));

    const options = [];

    if (!users.adicionais || !users.adicionais.includes('cooldown')) {
        options.push(
            new StringSelectMenuOptionBuilder()
                .setLabel('Adquirir Cooldown')
                .setValue('adquirir_cooldown')
                .setDescription('Otimize sua recuperação de membros')
                .setEmoji('1233103068942569543')
        );
    }

    if (!users.adicionais || !users.adicionais.includes('pullmails')) {
        options.push(
            new StringSelectMenuOptionBuilder()
                .setLabel('Adquirir Pull Email\'s')
                .setValue('adquirir_pullmails')
                .setDescription('Capture os endereços de email')
                .setEmoji('1233103068942569543')
        );
    }

    if (!users.adicionais || !users.adicionais.includes('divulgacao')) {
        options.push(
            new StringSelectMenuOptionBuilder()
                .setLabel('Adquirir Divulgação')
                .setValue('adquirir_divulgacao')
                .setDescription('Remova a divulgação automática')
                .setEmoji('1233103068942569543')
        );
    }

    const rows = [];

    if (options.length > 0) {
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('select_adquirir_adicionais')
            .setPlaceholder('Selecione os adicionais que deseja adquirir')
            .setMinValues(1)
            .setMaxValues(options.length)
            .addOptions(options);

        rows.push(new ActionRowBuilder().addComponents(selectMenu));
    }

    rows.push(
        new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('voltar_gerenciarassinatura')
                .setLabel('Voltar')
                .setEmoji('1106069998331514930')
                .setStyle(ButtonStyle.Secondary)
        )
    );

    container.addActionRowComponents(...rows);

    await interaction.update({ components: [container], flags: MessageFlags.IsComponentsV2 });
}

async function renovarassinatura(client, interaction) {
    const mensal = Number(General.get('plano_mensal'));
    const semanal = Number(General.get('plano_semanal'));
    const diario = Number(General.get('plano_diario'));

    let infos = messagesgeral.get(interaction.message.id);
    let users = registros.get(infos.token);

    let valoradicionais = 0;
    if (users.adicionais && users.adicionais.includes('cooldown')) {
        valoradicionais += Number(General.get('adicional_cooldown'));
    }
    if (users.adicionais && users.adicionais.includes('pullmails')) {
        valoradicionais += Number(General.get('adicional_pullmails'));
    }
    if (users.adicionais && users.adicionais.includes('divulgacao')) {
        valoradicionais += Number(General.get('adicional_divulgacao'));
    }

    const container = new ContainerBuilder()
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                `# Gerenciamento de Assinatura\n\n` +
                `- Escolha o tipo de renovação desejada.\n\n` +
                `**Valores Planos:**\n- Diário: \`${Number(diario).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}\`\n- Semanal: \`${Number(semanal).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}\`\n- Mensal: \`${Number(mensal).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}\`\n\n` +
                `**Valores C/ Adicionais:**\n- Diário: \`${Number(diario + valoradicionais).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}\`\n- Semanal: \`${Number(semanal + valoradicionais).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}\`\n- Mensal: \`${Number(mensal + valoradicionais).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}\`\n\n` +
                `**Importante:**\n- Na renovação da assinatura, será necessário efetuar o pagamento do valor total do plano selecionado, acrescido dos adicionais, se houverem.`
            )
        )
        .addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing("Small"));

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('diario')
            .setLabel('Diária (24h)')
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId('semanal')
            .setLabel('Semanal (7d)')
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId('mensal')
            .setLabel('Mensal (30d)')
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId('voltar_gerenciarassinatura')
            .setLabel('Voltar')
            .setEmoji('1106069998331514930')
            .setStyle(ButtonStyle.Secondary)
    );

    container.addActionRowComponents(row);

    await interaction.update({ components: [container], flags: MessageFlags.IsComponentsV2 });
}

async function dentroservidor(client, interaction, status, id, name) {
    let value = null;
    let nameserver = null;
    let idserver = null;
    try {
        value = interaction.values[0];
        nameserver = value.split('_')[1];
        idserver = value.split('_')[0];
    } catch (error) {
        nameserver = name;
        idserver = id;
    }

    const mensagem = messagesgeral.get(interaction.message.id);
    const infos = registros.get(mensagem.token);

    const info2 = configuracoes.get(idserver);

    let members2 = (infos?.usuarios ?? []).filter(user => user.access_token !== 'unauthorized');
    const dd = members2.filter(usuario => {
        return usuario.serverid && usuario.serverid.some(server => server.idserver === idserver);
    });

    let botao;
    let container;

    if (status == false) {
        container = new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `# Gerenciamento de Servidor | ${nameserver}\n\n` +
                    `- Aqui você pode gerenciar os membros do ${nameserver}.\n\n` +
                    `**Informações:**\n- \`Membros OAuth2: ${dd.length}\`\n\n` +
                    `**Importante:**\nO servidor **${nameserver}** está desvinculado`
                )
            )
            .addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing("Small"));

        botao = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`puxarmembros_${idserver}`)
                .setLabel('Puxar Membros')
                .setEmoji('<:emoji:1544020146031562753>')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('voltar_gerenciarservidores')
                .setLabel('Voltar')
                .setEmoji('1106069998331514930')
                .setStyle(ButtonStyle.Secondary)
        );
    } else {
        const isPrincipal = infos?.principalserver?.id == idserver ? '✅' : '❌';
        const hasCargos = info2?.cargos?.length == undefined ? '❌' : `✅ (${info2?.cargos?.length})`;
        const hasWebhook = info2?.webhook == undefined ? '❌' : '✅';

        container = new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `# Gerenciamento de Servidor | ${nameserver}\n\n` +
                    `- Aqui você pode gerenciar os membros do ${nameserver}.\n\n` +
                    `**Informações:**\n` +
                    `- \`Membros OAuth2: ${dd.length}\`\n` +
                    `- \`Servidor Principal: ${isPrincipal}\`\n` +
                    `- \`Cargo Configurado: ${hasCargos}\`\n` +
                    `- \`Log Configurada: ${hasWebhook}\``
                )
            )
            .addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing("Small"));

        botao = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`puxarmembros_${idserver}`)
                .setLabel('Puxar Membros')
                .setEmoji('<:emoji:1544020146031562753>')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId(`servidorprincipal_${idserver}_${nameserver}`)
                .setLabel('Adicionar como Principal')
                .setEmoji('<:emoji_9:1544807516003897358>')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId(`enviarmensagem_${idserver}`)
                .setLabel('Enviar Mensagem')
                .setEmoji('<:emoji_11:1544807401499394159>')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId(`Configurações_${idserver}_${nameserver}`)
                .setLabel('Configurações')
                .setEmoji('<:emoji_10:1544807625164587190>')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('voltar_gerenciarservidores')
                .setLabel('Voltar')
                .setEmoji('1106069998331514930')
                .setStyle(ButtonStyle.Secondary)
        );
    }

    container.addActionRowComponents(botao);

    await interaction.update({ components: [container], flags: MessageFlags.IsComponentsV2 });
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
    primeirapg,
    gerenciarservidores,
    gerenciarassinatura,
    gerenciarbot,
    generateToken,
    dentroservidor,
    renovarassinatura,
    adquiriradicionais
};

