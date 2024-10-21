const db = require('../db/db');

// Mocking Sequelize sync to avoid database sync errors during tests
beforeAll(async () => {
  await db.initDB();
});

// Clear the database after each test to ensure tests are independent
afterEach(async () => {
  await db.User.destroy({ where: {} });  // Delete all users
  await db.Game.destroy({ where: {} });  // Delete all games
});

// Test adding a game to the collection
test('addGameToCollection should add a game to the user\'s collection', async () => {
  const discordId = '123456789';
  const gameName = 'Catan';

  // Add the game to the user's collection
  await db.addGameToCollection(discordId, gameName);

  // Check if the game has been added to the user's collection
  const userGames = await db.getUserCollection(discordId);
  expect(userGames).toHaveLength(1);
  expect(userGames[0].name).toBe(gameName);
});

// Test fetching the user's collection when it's empty
test('getUserCollection should return an empty array for a new user', async () => {
  const discordId = '987654321';

  const userGames = await db.getUserCollection(discordId);
  expect(userGames).toHaveLength(0);
});

// Test adding multiple games to the collection
test('addGameToCollection should add multiple games to the user\'s collection', async () => {
  const discordId = '123456789';
  const game1 = 'Catan';
  const game2 = 'Carcassonne';

  // Add two games to the user's collection
  await db.addGameToCollection(discordId, game1);
  await db.addGameToCollection(discordId, game2);

  // Check if both games are in the collection
  const userGames = await db.getUserCollection(discordId);
  expect(userGames).toHaveLength(2);
  expect(userGames.map(game => game.name)).toEqual(expect.arrayContaining([game1, game2]));
});
