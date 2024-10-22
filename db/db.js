const { Sequelize, DataTypes } = require("sequelize");

// Initialize Sequelize with SQLite
const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: "database.sqlite",
});

// Define the Game model (only the ID is stored)
const Game = sequelize.define("Game", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
  },
});

// Define the User model
const User = sequelize.define("User", {
  discordId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
});

// Define Many-to-Many relationships
const UserGamesOwned = sequelize.define("UserGamesOwned", {});
const UserWishlist = sequelize.define("UserWishlist", {});

User.belongsToMany(Game, { through: UserGamesOwned, as: "gamesOwned" });
User.belongsToMany(Game, { through: UserWishlist, as: "wishlist" });

// Sync the database
const initDB = async () => {
  await sequelize.sync();
  console.log("Database synced");
};

// Add a game to a user's collection
const addGameToCollection = async (discordId, gameId) => {
  try {
    // Find or create the user
    let user = await User.findOne({ where: { discordId } });
    if (!user) {
      user = await User.create({ discordId });
    }

    // Check if the game is already in the user's collection
    const gameInCollection = await UserGamesOwned.findOne({
      where: {
        UserId: user.id,
        GameId: gameId,
      },
    });

    if (gameInCollection) {
      console.error(`Game with ID ${gameId} is already in user ${discordId}'s collection.`); // Log the detailed error
      return {
        success: false,
        message: "This game is already in your collection.",  // User-friendly message
      };
    }

    // Find or create the game (store only the ID)
    const [game] = await Game.findOrCreate({
      where: { id: gameId },
    });

    // Add the game to the user's collection
    await user.addGamesOwned(game);

    // Return a success message
    return {
      success: true,
      message: "The game has been added to your collection.",
    };
  } catch (error) {
    // Log unexpected errors
    console.error(`Error adding game with ID ${gameId} to user ${discordId}'s collection: ${error.message}`);
    return {
      success: false,
      message: "An error occurred while adding the game. Please try again later.",
    };
  }
};

// Remove a game from a user's collection
const removeGameFromCollection = async (discordId, gameId) => {
  try {
    // Find the user
    let user = await User.findOne({ where: { discordId } });
    if (!user) {
      console.error(`User with ID ${discordId} does not exist.`); // Log the detailed error
      return { success: false, message: "User does not exist." };  // User-friendly message
    }

    // Check if the game is in the user's collection
    const gameInCollection = await UserGamesOwned.findOne({
      where: {
        UserId: user.id,
        GameId: gameId,
      },
    });

    // If the game is not in the collection
    if (!gameInCollection) {
      console.error(`Game with ID ${gameId} is not in user ${discordId}'s collection.`); // Log detailed error
      return { success: false, message: "The specified game is not in your collection." };  // User-friendly message
    }

    // Remove the game from the user's collection
    await gameInCollection.destroy();  // This removes the record from the UserGamesOwned table

    // Return success message
    return { success: true, message: "The game has been removed from your collection." };
  } catch (error) {
    // Log any unexpected errors for debugging
    console.error(`Error while removing game from collection: ${error.message}`);
    return { success: false, message: "An error occurred while removing the game. Please try again later." };
  }
};

// Remove a game from a user's wishlist
const removeGameFromWishlist = async (discordId, gameId) => {
  try {
    // Find the user
    let user = await User.findOne({ where: { discordId } });
    if (!user) {
      console.error(`User with ID ${discordId} does not exist.`); // Log the detailed error
      return { success: false, message: "User does not exist." };  // User-friendly message
    }

    // Check if the game is in the user's wishlist
    const gameInWishlist = await UserGamesOwned.findOne({
      where: {
        UserId: user.id,
        GameId: gameId,
      },
    });

    // If the game is not in the wishlist
    if (!gameInWishlist) {
      console.error(`Game with ID ${gameId} is not in user ${discordId}'s wishlist.`); // Log detailed error
      return { success: false, message: "The specified game is not in your wishlist." };  // User-friendly message
    }

    // Remove the game from the user's wishlist
    await gameInWishlist.destroy();  // This removes the record from the UserGamesOwned table

    // Return success message
    return { success: true, message: "The game has been removed from your wishlist." };
  } catch (error) {
    // Log any unexpected errors for debugging
    console.error(`Error while removing game from wishlist: ${error.message}`);
    return { success: false, message: "An error occurred while removing the game. Please try again later." };
  }
};

// Get a user's collection
const getUserCollection = async (discordId) => {
  const user = await User.findOne({
    where: { discordId },
    include: { model: Game, as: "gamesOwned" },
  });
  return user ? user.gamesOwned.map((game) => game.id) : [];
};

// Add a game to a user's wishlist
const addGameToWishlist = async (discordId, gameId) => {
  try {
    // Find or create the user
    let user = await User.findOne({ where: { discordId } });
    if (!user) {
      user = await User.create({ discordId });
    }

    // Check if the game is already in the user's wishlist
    const gameInWishlist = await UserWishlist.findOne({
      where: {
        UserId: user.id,
        GameId: gameId,
      },
    });

    if (gameInWishlist) {
      console.error(`Game with ID ${gameId} is already in user ${discordId}'s wishlist.`); // Log the detailed error
      return {
        success: false,
        message: "This game is already in your wishlist.",  // User-friendly message
      };
    }

    // Find or create the game (store only the ID)
    const [game] = await Game.findOrCreate({
      where: { id: gameId },
    });

    // Add the game to the user's wishlist
    await user.addWishlist(game);

    // Return a success message
    return {
      success: true,
      message: "The game has been added to your wishlist.",
    };
  } catch (error) {
    // Log unexpected errors
    console.error(`Error adding game with ID ${gameId} to user ${discordId}'s wishlist: ${error.message}`);
    return {
      success: false,
      message: "An error occurred while adding the game. Please try again later.",
    };
  }
};

// Get a user's wishlist
const getUserWishlist = async (discordId) => {
  const user = await User.findOne({
    where: { discordId },
    include: { model: Game, as: "wishlist" },
  });
  return user ? user.wishlist.map((game) => game.id) : [];
};

module.exports = {
  initDB,
  addGameToCollection,
  removeGameFromCollection,
  getUserCollection,
  addGameToWishlist,
  removeGameFromWishlist,
  getUserWishlist,
};
