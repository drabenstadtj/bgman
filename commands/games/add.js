const {
  SlashCommandBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ComponentType,
} = require("discord.js");
const { searchGame } = require("../../services/bgg");
const { addGameToCollection, addGameToWishlist } = require("../../db/db");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("add")
    .setDescription("Adds a game to your collection or wishlist.")
    .addStringOption((option) =>
      option
        .setName("list")
        .setDescription("List to add to (Collection or Wishlist).")
        .setRequired(true)
        .addChoices(
          { name: "Collection", value: "col" },
          { name: "Wishlist", value: "wl" }
        )
    )
    .addStringOption((option) =>
      option
        .setName("game")
        .setDescription("Game to add to list.")
        .setRequired(true)
    ),
  async execute(interaction) {
    if (!interaction.isChatInputCommand()) return;

    const list = interaction.options.getString("list");
    const game = interaction.options.getString("game");
    const userId = interaction.user.id;

    // get the game id from the name, if not found reply with game couldnt be found
    const searchResult = await searchGame(game);

    // a selection menu to add the game
    const gameSelectMenu = new StringSelectMenuBuilder()
      .setCustomId("game-select")
      .setPlaceholder("Choose a game to add.")
      .addOptions(
        searchResult.reverse().map((game) => ({
          label: `${game.name} (${game.yearpublished})`,
          value: JSON.stringify({ id: game.id.toString(), name: game.name }), // This is where the ID is passed as the select menu value
        }))
      );

    // create the row, adding the select menu
    const row = new ActionRowBuilder().addComponents(gameSelectMenu);

    // send the select menu
    const response = await interaction.reply({
      content: "Select the game you want to add:",
      components: [row],
      ephemeral: true,
    });

    // filters the interactions to listen to
    const filter = (i) =>
      i.customId === "game-select" && i.user.id === interaction.user.id;

    // collect the response in 15 sec
    const collector = response.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      time: 30000,
    });

    collector.on("collect", async (i) => {
      const selectedGame = JSON.parse(i.values[0]);
      const selectedGameId = selectedGame.id;
      const selectedGameName = selectedGame.name;

      let result;
      if (list == "col") {
        console.log("adding to collection");
        result = await addGameToCollection(userId, selectedGameId);
      } else {
        console.log("adding to collection");
        result = await addGameToWishlist(userId, selectedGameId);
      }

      if (result.success) {
        await i.update({
          content: `${selectedGameName} has been added to your ${
            list === "col" ? "Collection" : "Wishlist"
          }.`,
          components: [],
        });
      } else {
        await i.update({
          content: `${selectedGameName} is already in your ${
            list === "col" ? "Collection" : "Wishlist"
          }.`,
          components: [],
        });
      }
    });

    collector.on("end", (collected) => {
      if (collected.size === 0) {
        interaction.editReply({
          content: "No selection made in time.",
          components: [],
        });
      }
    });
  },
};
