const download = require("./src/download");
const torrentParser = require("./src/torrent-parser");
const tracker = require("./src/tracker");
const torrent = torrentParser.open(process.argv[2]);

module.exports.run = () => {
  download(torrent, torrent.info.name);
};

this.run();
