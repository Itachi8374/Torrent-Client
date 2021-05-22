const fs = require("fs");
const bencode = require("bencode");
const tracker = require("./tracker");

const torrent = bencode.decode(fs.readFileSync("car.torrent"));

tracker.getPeers(torrent, (peers) => {
  console.log("list of peers: ", peers);
});
