const {
  SlashCommandBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ComponentType,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");
const { getGameDetails } = require("../../services/bgg");
const {
  getUserCollection,
  getUserWishlist,
  removeGameFromCollection,
  removeGameFromWishlist,
} = require("../../db/db");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("remove")
    .setDescription(
      "Removes the selected games from your collection or wishlist."
    )
    .addStringOption((option) =>
      option
        .setName("list")
        .setDescription("List to remove from (Collection or Wishlist).")
        .setRequired(true)
        .addChoices(
          { name: "Collection", value: "col" },
          { name: "Wishlist", value: "wl" }
        )
    ),
  async execute(interaction) {
    if (!interaction.isChatInputCommand()) return;

    const list = interaction.options.getString("list");
    const userId = interaction.user.id;

    // Fetch the user's collection or wishlist
    let gamesList;
    if (list === "col") {
      gamesList = await getUserCollection(userId);
    } else {
      gamesList = await getUserWishlist(userId);
    }

    if (!gamesList || gamesList.length === 0) {
      return interaction.reply({
        content: `Your ${list === "col" ? "collection" : "wishlist"} is empty.`,
        ephemeral: true,
      });
    }

    // Fetch game details for each game in the collection/wishlist
    const gameDetailsList = await Promise.all(
      gamesList.map(async (gameId) => {
        const gameDetails = await getGameDetails(gameId); // Fetch game details
        return {
          id: gameDetails.id,
          name: gameDetails.name,
        };
      })
    );

    // Populate select menu with the user's games
    const gameSelectMenu = new StringSelectMenuBuilder()
      .setCustomId("game-remove-select")
      .setPlaceholder("Select games to remove.")
      .setMinValues(1) // At least 1 selection is required
      .setMaxValues(gameDetailsList.length) // Allow selecting all games
      .addOptions(
        gameDetailsList.map((game) => ({
          label: game.name,
          value: game.id.toString(),
        }))
      );
    // Create a confirmation button
    const confirmButton = new ButtonBuilder()
      .setCustomId("confirm-remove")
      .setLabel("Confirm Removal")
      .setStyle(ButtonStyle.Danger);

    // Create action rows for select menu and button
    const rowSelect = new ActionRowBuilder().addComponents(gameSelectMenu);
    const rowButton = new ActionRowBuilder().addComponents(confirmButton);

    // Send the select menu and confirmation button
    const response = await interaction.reply({
      content: `Select the games you want to remove from your ${
        list === "col" ? "collection" : "wishlist"
      }:`,
      components: [rowSelect, rowButton],
      ephemeral: true,
    });

    // Filter for the select menu interaction
    const filter = (i) =>
      i.customId === "game-remove-select" && i.user.id === interaction.user.id;

    // Create a collector to capture selected games
    const collector = response.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      time: 30000, // 30 seconds to make a selection
    });

    let selectedGameIds = [];

    collector.on("collect", async (i) => {
      selectedGameIds = i.values; // Capture selected game IDs
      await i.update({
        content: `You selected ${selectedGameIds.length} game(s) to remove. Press "Confirm Removal" to proceed.`,
        components: [rowButton], // Only show the confirm button now
      });
    });

    // Filter for the confirmation button interaction
    const buttonFilter = (i) =>
      i.customId === "confirm-remove" && i.user.id === interaction.user.id;

    // Create a button collector to confirm removal
    const buttonCollector = response.createMessageComponentCollector({
      componentType: ComponentType.Button,
      filter: buttonFilter,
      time: 30000, // 30 seconds to confirm
    });

    buttonCollector.on("collect", async (i) => {
        let resultMessage;
      // Remove selected games from collection or wishlist
      for (const gameId of selectedGameIds) {
        let result;
        if (list === "col") {
          result = await removeGameFromCollection(userId, gameId);
        } else {
          result = await removeGameFromWishlist(userId, gameId);
        }

        resultMessage = result.message;
      }

      await i.update({
        content: `${resultMessage}`,
        components: [],
      });
    });

    collector.on("end", (collected) => {
      if (collected.size === 0) {
        interaction.editReply({
          content: "No selection made in time.",
          components: [],
        });
      }
    });

    buttonCollector.on("end", (collected) => {
      if (collected.size === 0) {
        interaction.editReply({
          content: "No confirmation made in time.",
          components: [],
        });
      }
    });
  },
};
