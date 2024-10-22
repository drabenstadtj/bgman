const axios = require("axios");
const xml2js = require("xml2js");
const stringSimilarity = require('string-similarity');

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

// // Search for games by name
// const searchGame = async (query) => {
//   const url = `${BASE_URL}/search?query=${encodeURIComponent(
//     query
//   )}&type=boardgame`;
//   const response = await axios.get(url);
//   const parsedData = await parseXML(response.data);

//   // If no games are found, return an empty array
//   if (!parsedData.items || !parsedData.items.item) {
//     return [];
//   }

//   // Return the list of games found (with name and ID)
//   const games = parsedData.items.item
//     .map((game) => ({
//       id: game.$.id,
//       name: game.name.$.value,
//       yearpublished: game.yearpublished
//         ? game.yearpublished.$.value
//         : "Unknown",
//     })).slice(20);

//   // Calculate the weight for each game and sort by weight
//   const gamesWithWeights = await Promise.all(
//     games.map(async (game) => {
//       const weight = await getGameWeight(game.id); // Fetch weight using getGameStats
//       return {
//         ...game, // Keep existing game properties
//         weight: weight || 0, // Assign the weight, default to 0 if no weight found
//       };
//     })
//   );

//   // Sort the games by weight in descending order
//   gamesWithWeights.sort((a, b) => b.weight - a.weight);
  
//   //return the top 10 results
//   return gamesWithWeights.slice(0,10);
// };
// Search for games by name and rank by similarity to query
const searchGame = async (query) => {
  const url = `${BASE_URL}/search?query=${encodeURIComponent(query)}&type=boardgame`;
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
    yearpublished: game.yearpublished ? game.yearpublished.$.value : 'Unknown',
  }));

  // Calculate the similarity score for each game name
  const gamesWithSimilarity = games.map((game) => {
    const similarity = stringSimilarity.compareTwoStrings(query.toLowerCase(), game.name.toLowerCase());
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

const getGameWeight = async (gameId) => {
  try {
    const url = `${BASE_URL}/thing?id=${gameId}&stats=1`;
    const response = await axios.get(url);

    // Parse the XML response
    const parsedData = await parseXML(response.data);

    // Check if the parsed data has the item and statistics
    if (parsedData.items && parsedData.items.item) {
      const game = parsedData.items.item;

      // Extract the statistics section
      if (game.statistics && game.statistics.ratings) {
        const stats = game.statistics.ratings;

        // Extract usersrated and average rating values
        const usersRated = parseFloat(stats.usersrated.$.value);
        const averageRating = parseFloat(stats.average.$.value);

        // Calculate the product of usersrated and average rating
        const weight = usersRated * averageRating;

        return weight; // Return the calculated weight
      } else {
        console.log(`No statistics available for game ID: ${gameId}`);
        return null;
      }
    } else {
      console.log(`No game data found for game ID: ${gameId}`);
      return null;
    }
  } catch (error) {
    console.error(`Error fetching stats for game ID: ${gameId}`, error);
    return null;
  }
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

  return {
    id: game?.$?.id || gameId,
    name: name,
    yearpublished: game?.yearpublished?.$?.value || "Unknown Year",
    minplayers: game?.minplayers?.$?.value || "Unknown",
    maxplayers: game?.maxplayers?.$?.value || "Unknown",
    playingtime: game?.playingtime?.$?.value || "Unknown",
    average_rating: game?.statistics?.ratings?.average?.$?.value || "N/A",
    rank: game?.statistics?.ratings?.ranks?.rank[0]?.$.value || "N/A",
  };
};

module.exports = {
  searchGame,
  getGameDetails,
};
