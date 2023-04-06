const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require ('discord.js')
const TicketSetup = require('../../database/TicketSetupDB');
const Ticket = require('../../database/TicketDB');


module.exports = {
    data: new SlashCommandBuilder()
    .setName('tickets')
    .setDescription('Opções e configuração de tickets')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(subcommand =>
        subcommand.setName('setup')
        .setDescription('Configuração de tickets')
        .addChannelOption(option =>
            option.setName('channel')
            .setDescription('Secione o canal onde os tickets devem ser criados')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
        )
        .addChannelOption(option =>
            option.setName('category')
            .setDescription('Secione a categoria onde os tickets devem ser criados..')
            .addChannelTypes(ChannelType.GuildCategory)
            .setRequired(true)
        )
        .addChannelOption(option =>
            option.setName('transcripts')
            .setDescription('Selecione o canal para onde as transcrições devem ser enviadas.')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
        )
        .addRoleOption(option =>
            option.setName('support-role')
            .setDescription('cargo de suporte para o ticket')
            .setRequired(true)
        )
        .addRoleOption(option =>
            option.setName('everyone')
            .setDescription('Selecione o cargo de everyone. (Você deve selecionar o cargo de everyone) IMPORTANTEE')
            .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('button-name')
            .setDescription('Nome do botão')
            .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('emoji')
            .setDescription('coloque o emoji do botão')
            .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('description')
            .setDescription('O texto a enviar com o painel de tickets')
            .setRequired(false)
        )
    )
    .addSubcommand(subcommand =>
        subcommand.setName('delete-users')
        .setDescription('Exclua os tickets dos usuários (use este comando somente se você removeu o ticket manualmente)')
    )
    .addSubcommand(subcommand =>
        subcommand.setName('delete-setup')
        .setDescription('Excluir o sistema de tickets (painel)')
    ),

    async execute (interaction, client) {

        const { guild, options } = interaction;

        if (interaction.options.getSubcommand() === "setup") {
            const channel = options.getChannel('channel');
            const category = options.getChannel('category');
            const transcripts = options.getChannel('transcripts');
            const handlers = options.getRole('support-role');
            const everyone = options.getRole('everyone');
            const description = options.getString('description');
            const button = options.getString('button-name');
            const emoji = options.getString('emoji');
            await TicketSetup.findOneAndUpdate(
              { GuildID: guild.id },
              {
                Channel: channel.id,
                Category: category.id,
                Transcripts: transcripts.id,
                Handlers: handlers.id,
                Everyone: everyone.id,
                Description: description,
                //Button: [button[0]],
              },
              {
                new: true,
                upsert: true,
              }
            ).catch((err) => console.log(err));
    
            interaction
            .reply({
              embeds: [
                new EmbedBuilder()
                  .setTitle("Sistema de Tickets")
                  .setDescription("Sistema de tickets configurado com sucesso!")
                  .setColor('Green')
                  .addFields(
                    {
                      name: "<:channel:1056715573242892338> Channel",
                      value: `<:icon_reply:1088996218283229184>  <#${channel.id}>`,
                      inline: true,
                    },
                    {
                      name: "<:orangenwand:1056716503921205301> Cargo de Suporte",
                      value: `<:icon_reply:1088996218283229184>  <@&${handlers.id}>`,
                      inline: true,
                    },
                    {
                      name: "<:Discussions:1056716758611939348> Descrição do Painel",
                      value: `<:icon_reply:1088996218283229184>  ${description}`,
                      inline: true,
                    },
                    {
                      name: "Ticket Logs",
                      value: `<#${transcripts.id}>`,
                    }
                  ),
              ],
              ephemeral: true,
            })
            .catch(async (err) => {
              console.log(err);
              await interaction.reply({
                content: "ocorreu um erro...",
              });
            });
      
            const sampleMessage =
            `Bem-vindo ao tickets! Clique no botão **"${button}"** para criar um ticket e a equipe de suporte entrará em contato com você!`;
      
            const embed = new EmbedBuilder()
              .setTitle("Sistema de Tickets")
              .setDescription(description == null ? sampleMessage : description)
              .setColor("Aqua")
              .setImage("https://i.imgur.com/MVWa8pZ.png")
      
            const buttonshow = new ButtonBuilder()
              .setCustomId('createTicket')
              .setLabel(button)
              .setEmoji(emoji)
              .setStyle(ButtonStyle.Primary);
      
            await guild.channels.cache.get(channel.id).send({
              embeds: [embed],
              components: [new ActionRowBuilder().addComponents(buttonshow)],
            }).catch(error => {return});
        } 
        if (interaction.options.getSubcommand() === "delete-users") {
    
          const ticketData = await TicketSetup.findOne({
            GuildID: interaction.guild.id,
          });
    
          if (!ticketData) {
            return interaction.reply({
              embeds: [
                new EmbedBuilder()
                  .setTitle("Sistema de Tickets")
                  .setDescription("Já excluiu todos os tickets abertos por usuários no banco de dados!")
                  .addFields(
                    {
                      name: "<:Slash:1088996088712794162> IMPORTANTE",
                      value: "<:icon_reply:1088996218283229184> **SE TIVER TICKETS ABERTOS DEPOIS DE USAR ESTE COMANDO TERÁ QUE REMOVÊ-LOS MANUALMENTE**",
                      inline: true,
                    },
                  ),
              ],
              ephemeral: true,
            });
          }
    
          Ticket
            .findOneAndDelete({
              GuildID: interaction.guild.id,
            })
            .catch((err) => console.log(err));
    
          interaction.reply({
            embeds: [
              new EmbedBuilder()
                .setTitle("Sistema de Tickets")
                .setColor("Green")
                .setDescription("Excluído com sucesso o sistema de tickets!")
                .addFields(
                  {
                    name: "IMPORTANTE",
                    value: "**SE TIVER TICKETS ABERTOS DEPOIS DE USAR ESTE COMANDO TERÁ QUE REMOVÊ-LOS MANUALMENTE**"
                  }
                ),
            ],
            ephemeral: true,
          });
        }
    
        if (interaction.options.getSubcommand() === "delete-setup") {
          const ticketData = await TicketSetup.findOne({
            GuildID: interaction.guild.id,
          });
    
          if (!ticketData) {
            return interaction.reply({
              embeds: [
                new EmbedBuilder()
                  .setTitle("Sistema de Tickets")
                  .setDescription("Seu painel de tickets já foi excluído!")
                  .addFields(
                    {
                      name: "<:Slash:1088996088712794162> uSAR",
                      value: "<:icon_reply:1088996218283229184>  /tickets setup",
                      inline: true,
                    },
                  ),
              ],
              ephemeral: true,
            });
          }
    
          TicketSetup
            .findOneAndDelete({
              GuildID: interaction.guild.id,
            })
            .catch((err) => console.log(err));
    
          interaction.reply({
            embeds: [
              new EmbedBuilder()
                .setTitle("Sistema de Tickets")
                .setDescription("Excluído com sucesso o sistema de tickets!"),
            ],
            ephemeral: true,
          });
        }

    }
}