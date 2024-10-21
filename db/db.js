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

  // Find or create the game (store only the ID)
  const [game] = await Game.findOrCreate({
    where: { id: gameId },
  });

  // Add the game to the user's collection
  await user.addGamesOwned(game);

  // Return the game ID (no need to return full details from DB)
  return { id: gameId };
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
const addToWishlist = async (discordId, gameId) => {
  let user = await User.findOne({ where: { discordId } });
  if (!user) {
    user = await User.create({ discordId });
  }

  const [game] = await Game.findOrCreate({
    where: { id: gameId },
  });

  await user.addWishlist(game);
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
  addToWishlist,
  getUserWishlist,
};
