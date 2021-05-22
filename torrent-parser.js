const fs = require("fs");
const bencode = require("bencode");

module.exports.open = (filepath) => {
  const torrent = bencode.decode(fs.readFileSync(filepath));
  return torrent;
};

module.exports.size = (torrent) => {
  //...
};

module.exports.infoHash = (torrent) => {
  //...
};
