const axios = require("axios");
const xml2js = require("xml2js");
const stringSimilarity = require("string-similarity");

// Base URI for BGG API
const BASE_URL = "https://boardgamegeek.com/xmlapi2";

// Helper function to parse XML response
const parseXML = async (xml) => {
  return new Promise((resolve, reject) => {
    xml2js.parseString(xml, { explicitArray: false }, (err, result) => {
      if (err) {
        return reject(err);
      }
      resolve(result);
    });
  });
};

// Search for games by name and rank by similarity to query
const searchGame = async (query) => {
  const url = `${BASE_URL}/search?query=${encodeURIComponent(
    query
  )}&type=boardgame`;
  const response = await axios.get(url);
  const parsedData = await parseXML(response.data);

  // If no games are found, return an empty array
  if (!parsedData.items || !parsedData.items.item) {
    return [];
  }

  // Extract the list of games
  const games = parsedData.items.item.map((game) => ({
    id: game.$.id,
    name: game.name.$.value,
    yearpublished: game.yearpublished ? game.yearpublished.$.value : "Unknown",
  }));

  // Calculate the similarity score for each game name
  const gamesWithSimilarity = games.map((game) => {
    const similarity = stringSimilarity.compareTwoStrings(
      query.toLowerCase(),
      game.name.toLowerCase()
    );
    return {
      ...game,
      similarity,
    };
  });

  // Sort the games by similarity in descending order
  gamesWithSimilarity.sort((a, b) => b.similarity - a.similarity);

  // Return the top 10 most relevant results
  return gamesWithSimilarity.slice(0, 10).reverse();
};

const getGameDetails = async (gameId) => {
  const url = `${BASE_URL}/thing?id=${gameId}&stats=1`;
  const response = await axios.get(url);

  // Parse the XML response
  const parsedData = await parseXML(response.data);
  const game = parsedData.items.item;

  // Handle the case where the name might be an array or a single object
  let name = "Unknown Name";
  if (Array.isArray(game?.name)) {
    name = game.name[0]?.$?.value || name;
  } else if (game?.name?.$?.value) {
    name = game.name.$.value;
  }

  // Get the link (you can construct a link based on the game ID)
  const link = `https://boardgamegeek.com/boardgame/${gameId}`;

  // clean html character codes
  game.description = game.description
    .replace(/&#10;/g, "\n") // Replaces &#10; with newline
    .replace(/&rsquo;/g, "'") // Replace right single quote
    .replace(/&ldquo;/g, '"') // Replace left double quote
    .replace(/&rdquo;/g, '"') // Replace right double quote
    .replace(/&amp;/g, "&");

  // Return the game details
  return {
    id: game?.$?.id || gameId,
    name: name,
    link: link, // Add link to the return object
    description: game?.description || "No description available", // Add description
    yearpublished: game?.yearpublished?.$?.value || "Unknown Year",
    minplayers: game?.minplayers?.$?.value || "Unknown",
    maxplayers: game?.maxplayers?.$?.value || "Unknown",
    playingtime: game?.playingtime?.$?.value || "Unknown",
    average_rating: game?.statistics?.ratings?.average?.$?.value || "N/A",
    rank: game?.statistics?.ratings?.ranks?.rank[0]?.$.value || "N/A",
    image: game?.image || null, // Add image if available
  };
};

module.exports = {
  searchGame,
  getGameDetails,
};
