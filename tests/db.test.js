// __tests__/db.test.js
const { Sequelize, DataTypes } = require('sequelize');
const { initDB, addGameToCollection, getUserCollection, addGameToWishlist, getUserWishlist } = require('../db/db');

// Initialize in-memory SQLite for testing
let sequelize;
let Game, User, UserGamesOwned, UserWishlist;

beforeAll(async () => {
  // In-memory SQLite instance
  sequelize = new Sequelize('sqlite::memory:', { logging: false });

  // Define models as in your db file
  Game = sequelize.define("Game", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
  });

  User = sequelize.define("User", {
    discordId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
  });

  UserGamesOwned = sequelize.define("UserGamesOwned", {});
  UserWishlist = sequelize.define("UserWishlist", {});

  User.belongsToMany(Game, { through: UserGamesOwned, as: "gamesOwned" });
  User.belongsToMany(Game, { through: UserWishlist, as: "wishlist" });

  // Sync all models
  await sequelize.sync();
});

// Close connection after all tests
afterAll(async () => {
  await sequelize.close();
});

describe('Database operations', () => {
  beforeEach(async () => {
    // Reset the database before each test
    await Game.destroy({ where: {}, truncate: true });
    await User.destroy({ where: {}, truncate: true });
    await UserGamesOwned.destroy({ where: {}, truncate: true });
    await UserWishlist.destroy({ where: {}, truncate: true });
  });

  test('Add a game to user collection', async () => {
    const discordId = '12345';
    const gameId = 1;

    const result = await addGameToCollection(discordId, gameId);
    expect(result.success).toBe(true);
    expect(result.message).toBe(`Game with ID ${gameId} has been added to the collection of user with ID ${discordId}.`);

    const collection = await getUserCollection(discordId);
    expect(collection).toContain(gameId);
  });

  test('Add the same game to user collection (should not add again)', async () => {
    const discordId = '12345';
    const gameId = 1;

    // Add game to collection
    await addGameToCollection(discordId, gameId);
    
    // Try adding the same game again
    const result = await addGameToCollection(discordId, gameId);
    expect(result.success).toBe(false);
    expect(result.message).toBe(`Game with ID ${gameId} is already in your collection.`);

    const collection = await getUserCollection(discordId);
    expect(collection.length).toBe(1);  // Should still contain only one game
  });

  test('Add a game to user wishlist', async () => {
    const discordId = '67890';
    const gameId = 2;

    const result = await addGameToWishlist(discordId, gameId);
    expect(result.success).toBe(true);
    expect(result.message).toBe(`Game with ID ${gameId} has been added to the wishlist of user with ID ${discordId}.`);

    const wishlist = await getUserWishlist(discordId);
    expect(wishlist).toContain(gameId);
  });

  test('Add the same game to user wishlist (should not add again)', async () => {
    const discordId = '67890';
    const gameId = 2;

    // Add game to wishlist
    await addGameToWishlist(discordId, gameId);

    // Try adding the same game again
    const result = await addGameToWishlist(discordId, gameId);
    expect(result.success).toBe(false);
    expect(result.message).toBe(`Game with ID ${gameId} is already in your wishlist.`);

    const wishlist = await getUserWishlist(discordId);
    expect(wishlist.length).toBe(1); // Should still contain only one game
  });

  test('Retrieve a user collection', async () => {
    const discordId = '54321';
    const gameIds = [3, 4];

    // Add multiple games to the collection
    await addGameToCollection(discordId, gameIds[0]);
    await addGameToCollection(discordId, gameIds[1]);

    const collection = await getUserCollection(discordId);
    expect(collection).toEqual(expect.arrayContaining(gameIds));
  });

  test('Retrieve a user wishlist', async () => {
    const discordId = '09876';
    const gameIds = [5, 6];

    // Add multiple games to the wishlist
    await addGameToWishlist(discordId, gameIds[0]);
    await addGameToWishlist(discordId, gameIds[1]);

    const wishlist = await getUserWishlist(discordId);
    expect(wishlist).toEqual(expect.arrayContaining(gameIds));
  });
});
