// @ts-nocheck
import { ActionRowBuilder, EmbedBuilder, ButtonBuilder, InteractionType, ChannelType, PermissionsBitField, RoleSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ChannelSelectMenuBuilder } from 'discord.js';
import { messagesgeral, registros } from '../../../database/oauth2/index.ts';

export default {
    name: 'interactionCreate',

    run: async (interaction, client) => {

        if (interaction.isButton()) {
            if (interaction.customId === 'pullmails') {
                await interaction.reply({ content: 'Puxando emails...', ephemeral: true })
                const message = messagesgeral.get(interaction.message.id)
                const information = registros.get(message.token)

                let allemails = Array.from(new Set(information.usuarios.map(user => user.email)));

                if(allemails.length == 0) return interaction.editReply({ content: '❌ enhum email encontrado', ephemeral: true })
                let buffer = Buffer.from(allemails.join('\n'), 'utf-8')

                const embed = new EmbedBuilder()
                    .setTitle('Emails dos Usuários')
                    .setDescription(`- Foram encontrados \`${allemails.length}\`, abra o arquivo para ver todos os emails`)
                    .setColor('Green')

                interaction.editReply({ content: ``, embeds: [embed], files: [{ attachment: buffer, name: 'emails.txt' }] })
            }
        }
    }
}