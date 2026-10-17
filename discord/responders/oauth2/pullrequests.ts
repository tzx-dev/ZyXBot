// @ts-nocheck
import { ActionRowBuilder, EmbedBuilder, ButtonBuilder, InteractionType, ChannelType, PermissionsBitField, RoleSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ChannelSelectMenuBuilder } from 'discord.js';
import { PullMembers } from '../../../discord/menus/oauth2/runtime/member-pull.ts';
import { messagesgeral, registros } from '../../../database/oauth2/index.ts';


export default {
    name: 'interactionCreate',

    run: async (interaction, client) => {

        if (interaction.isButton()) {


            if (interaction.customId === 'recuperarmembros') {
                const message = messagesgeral.get(interaction.message.id)
                const information = registros.get(message.token)
                let dd = (information?.usuarios ?? []).filter(user => user.access_token !== 'unauthorized');

                const modal = new ModalBuilder()
                    .setTitle('Recuperar membros')
                    .setCustomId('modal_recuperarmembros')

                const id = new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('id')
                        .setLabel(`Informe o ID do servidor`)

                        .setStyle(TextInputStyle.Short)
                )

                const quantidade = new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('quantidade')
                        .setLabel(`Informe a quantidade de membros`)
                        .setPlaceholder(`Membros OAuth2: ${dd.length}`)
                        .setStyle(TextInputStyle.Short)
                )

                modal.addComponents(id, quantidade)
                await interaction.showModal(modal)
            }

            if (interaction.customId.startsWith('puxarmembros_')) {
                const idserver = interaction.customId.split('_')[1]

                const message = messagesgeral.get(interaction.message.id)
                const information = registros.get(message.token)

                let members2 = (information?.usuarios ?? []).filter(user => user.access_token !== 'unauthorized');
                dd = members2.filter(usuario => {
                    return usuario.serverid.some(server => server.idserver === idserver);
                });


                const modal = new ModalBuilder()
                    .setTitle('Recuperar membros')
                    .setCustomId(`wdawmwdwadodal_${idserver}`)

                const id = new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('id')
                        .setLabel(`Informe o ID do servidor`)

                        .setStyle(TextInputStyle.Short)
                )

                const quantidade = new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('quantidade')
                        .setLabel(`Informe a quantidade de membros`)
                        .setPlaceholder(`Membros OAuth2: ${dd.length}`)
                        .setStyle(TextInputStyle.Short)
                )

                modal.addComponents(id, quantidade)
                await interaction.showModal(modal)
            }
        }


        if (interaction.type == InteractionType.ModalSubmit) {
            if(interaction.customId.startsWith('wdawmwdwadodal_')){
                const idserver22 = interaction.customId.split('_')[1]
                const idserver = interaction.fields.getTextInputValue('id');
                const quantidade = interaction.fields.getTextInputValue('quantidade');
                PullMembers(interaction, client, idserver, quantidade, idserver22)

            }

            if (interaction.customId.startsWith('modal_recuperarmembros')) {
                const idserver = interaction.fields.getTextInputValue('id');
                const quantidade = interaction.fields.getTextInputValue('quantidade');

                

                

                PullMembers(interaction, client, idserver, quantidade)


            }
        }
    }
}