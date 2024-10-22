const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType,
  } = require('discord.js');
  const { getUserCollection, getUserWishlist } = require('../../db/db');
  const { getGameDetails } = require('../../services/bgg')
  
  module.exports = {
    data: new SlashCommandBuilder()
      .setName('list')
      .setDescription('Shows a list of your collection or wishlist with pagination.')
      .addStringOption((option) =>
        option
          .setName('list')
          .setDescription('List to show (Collection or Wishlist).')
          .addChoices(
            { name: 'Collection', value: 'col' },
            { name: 'Wishlist', value: 'wl' }
          )
          .setRequired(false)
      ),
    async execute(interaction) {
      const list = interaction.options.getString('list');
      const userId = interaction.user.id;
  
      let collection = [];
      let wishlist = [];
  
      // Fetch data
      if (!list || list === 'col') {
        collection = await getUserCollection(userId);
      }
      if (!list || list === 'wl') {
        wishlist = await getUserWishlist(userId);
      }
  
      // Combine the collection and wishlist
      const games = list === 'col' ? collection : list === 'wl' ? wishlist : [...collection, ...wishlist];
  
      if (games.length === 0) {
        await interaction.reply({
          content: `No games found in your ${list ? (list === 'col' ? 'collection' : 'wishlist') : 'collection or wishlist'}.`,
          ephemeral: true,
        });
        return;
      }
  
      // Fetch game details (like description, image, and link)
      const detailedGames = await Promise.all(
        games.map(async (gameId) => {
          const gameDetails = await getGameDetails(gameId); // Assuming this gets the description, image, and URL
          return gameDetails;
        })
      );
  
      // Paginate the result
      const pageSize = 5; // 5 games per page
      let currentPage = 0;
      const totalPages = Math.ceil(detailedGames.length / pageSize);
  
      const generateEmbed = (page) => {
        const start = page * pageSize;
        const end = start + pageSize;
        const gamesOnPage = detailedGames.slice(start, end);
      
        const embed = new EmbedBuilder()
          .setTitle(`${list ? (list === 'col' ? 'Collection' : 'Wishlist') : 'Collection & Wishlist'}`)
          .setDescription(`Page ${page + 1} of ${totalPages}`)
          .setColor('#00ff00');
      
        // Add fields for each game
        gamesOnPage.forEach((game) => {
          // Truncate description if it exceeds the limit (1000 chars in this example)
          const truncatedDescription = game.description.length > 1000 
            ? `${game.description.slice(0, 500).trim()}...` 
            : game.description;
      
          embed.addFields({
            name: `${game.name} (${game.yearpublished})`,
            value: `[View Game](${game.link})\n\n${truncatedDescription}\n\n`, 
          },
        {
            name:' ',
            value:'====='
        },{
            name:' ',
            value:' '
        });
        });
      
        return embed;
      };
      
  
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('prev')
          .setLabel('Previous')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(currentPage === 0),
        new ButtonBuilder()
          .setCustomId('next')
          .setLabel('Next')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(currentPage === totalPages - 1)
      );
  
      const message = await interaction.reply({
        embeds: [generateEmbed(currentPage)],
        components: [row],
        ephemeral: true,
      });
  
      const collector = message.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 60000, // Collect interactions for 1 minute
      });
  
      collector.on('collect', async (i) => {
        if (i.customId === 'prev' && currentPage > 0) {
          currentPage--;
        } else if (i.customId === 'next' && currentPage < totalPages - 1) {
          currentPage++;
        }
  
        // Update embed and buttons
        await i.update({
          embeds: [generateEmbed(currentPage)],
          components: [
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId('prev')
                .setLabel('Previous')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(currentPage === 0),
              new ButtonBuilder()
                .setCustomId('next')
                .setLabel('Next')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(currentPage === totalPages - 1)
            ),
          ],
        });
      });
  
      collector.on('end', () => {
        // Disable buttons after interaction time ends
        interaction.editReply({
          components: [],
        });
      });
    },
  };
