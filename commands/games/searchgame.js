const { SlashCommandBuilder } = require('discord.js');
const { searchGame } = require('../../services/bgg');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('searchgame')
    .setDescription('Search for a board game by name.')
    .addStringOption(option =>
      option.setName('query')
        .setDescription('The name of the board game to search for.')
        .setRequired(true)),
  
  async execute(interaction) {
    const query = interaction.options.getString('query');
    
    try {
      const games = await searchGame(query);

      if (games.length === 0) {
        return await interaction.reply('No games found.');
      }

      const gameList = games.map(game => `${game.name} (${game.yearpublished}) [ID: ${game.id}]`).join('\n');
      await interaction.reply(`Games found:\n${gameList}`);
    } catch (error) {
      console.error(error);
      await interaction.reply('There was an error searching for games.');
    }
  },
};
