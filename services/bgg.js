const axios = require("axios");
const xml2js = require("xml2js");

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

// Search for games by name
const searchGame = async (query) => {
  const url = `${BASE_URL}/search?query=${encodeURIComponent(
    query
  )}&type=boardgame`;
  const response = await axios.get(url);
  const parsedData = await parseXML(response.data);

  // Return the list of games found (with name and ID)
  const games = parsedData.items.item.map((game) => ({
    id: game.$.id,
    name: game.name.$.value,
    yearpublished: game.yearpublished ? game.yearpublished.$.value : "Unknown",
  }));

  return games;
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
