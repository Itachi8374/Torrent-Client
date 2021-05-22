const fs = require("fs");
const bencode = require("bencode");

const torrent = bencode.decode(fs.readFileSync("car.torrent"));
console.log(torrent["announce"].toString("utf8"));
