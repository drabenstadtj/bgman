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
    return { success: false, message: `Game with ID ${gameId} is already in your collection.` };
  }

  // Find or create the game (store only the ID)
  const [game] = await Game.findOrCreate({
    where: { id: gameId },
  });

  // Add the game to the user's collection
  await user.addGamesOwned(game);

  // Return a success message
  return { success: true, message: `Game with ID ${gameId} has been added to the collection of user with ID ${discordId}.` };
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
    return { success: false, message: `Game with ID ${gameId} is already in your wishlist.` };
  }

  // Find or create the game (store only the ID)
  const [game] = await Game.findOrCreate({
    where: { id: gameId },
  });

  // Add the game to the user's wishlist
  await user.addWishlist(game);

  // Return a success message
  return { success: true, message: `Game with ID ${gameId} has been added to the wishlist of user with ID ${discordId}.` };
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
  getUserCollection,
  addGameToWishlist,
  getUserWishlist,
};
