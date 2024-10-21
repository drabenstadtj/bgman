const { SlashCommandBuilder } = require('discord.js');
const { addGameToCollection } = require('../../db/db'); // Ensure the path is correct
const { getGameDetails } = require('../../services/bgg'); // Ensure the path is correct

module.exports = {
  data: new SlashCommandBuilder()
    .setName('addgame')
    .setDescription('Add a game to your collection by its BGG ID.')
    .addIntegerOption(option =>
      option.setName('gameid')
        .setDescription('The BGG ID of the game to add to your collection.')
        .setRequired(true)),

  async execute(interaction) {
    const gameId = interaction.options.getInteger('gameid');

    try {
      // Add the game to the collection (store only the gameId)
      await addGameToCollection(interaction.user.id, gameId);

      // Fetch the full game details dynamically from the BGG API
      const gameDetails = await getGameDetails(gameId);

      // Display the full game details to the user
      await interaction.reply(`Added "${gameDetails.name}" (Published: ${gameDetails.yearpublished}, Players: ${gameDetails.minplayers}-${gameDetails.maxplayers}, Avg Rating: ${gameDetails.average_rating}) to your collection!`);
    } catch (error) {
      console.error(error);
      await interaction.reply('There was an error adding the game to your collection.');
    }
  },
};
