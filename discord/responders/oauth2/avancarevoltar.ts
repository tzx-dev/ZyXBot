// @ts-nocheck
import { ActionRowBuilder, EmbedBuilder, ButtonBuilder, InteractionType, ChannelType, PermissionsBitField, RoleSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ChannelSelectMenuBuilder } from 'discord.js';
import { messagesgeral } from '../../../database/oauth2/index.ts';
import { gerenciarservidores, primeirapg, gerenciarassinatura, gerenciarbot, renovarassinatura, adquiriradicionais } from '../../../discord/menus/oauth2/runtime/application.ts';

export default {
    name: 'interactionCreate',

    run: async (interaction, client) => {

        if (interaction.isButton()) {
            
            if (interaction.customId === 'voltar_primeirapg') {
               let token  =  messagesgeral.get(interaction.message.id)
                primeirapg(client, interaction, 1, token.token)
            }
            if (interaction.customId === 'voltar_gerenciarservidores') {
                gerenciarservidores(client, interaction, 1)
            }
            if (interaction.customId === 'gerenciarassinatura') {
                gerenciarassinatura(client, interaction, 1)
            }
            if (interaction.customId === 'gerenciarservidores') {
                gerenciarservidores(client, interaction)
            }
            if (interaction.customId === 'voltar_gerenciarassinatura') {
                gerenciarassinatura(client, interaction)
            }
            if (interaction.customId === 'renovarassinatura') {
                renovarassinatura(client, interaction)
            }
            if (interaction.customId === 'adquiriradicionais') {
                adquiriradicionais(client, interaction)
            }
            if (interaction.customId === 'gerenciarbot') {
                gerenciarbot(client, interaction)
            }
            if (interaction.customId === 'cancelartrocartoken') {
                gerenciarbot(client, interaction)
            }
            if(interaction.customId == 'pganterior'){
                let token = messagesgeral.get(interaction.message.id)
                gerenciarservidores(client, interaction, token.page.page - 1)
            }
            if(interaction.customId == 'pgseguinte'){
                let token = messagesgeral.get(interaction.message.id)
                gerenciarservidores(client, interaction, token.page.page + 1)
            }
        }
    }
}