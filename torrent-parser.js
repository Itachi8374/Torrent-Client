const fs = require("fs");
const bencode = require("bencode");
const crypto = require("crypto");
const bignum = require("bignum");

module.exports.open = (filepath) => {
  const torrent = bencode.decode(fs.readFileSync(filepath));
  return torrent;
};

module.exports.size = (torrent) => {
  const size = torrent.info.files
    ? torrent.info.files.map((file) => file.length).reduce((a, b) => a + b)
    : torrent.info.length;

  return bignum.toBuffer(size, { size: 8 });
};

module.exports.infoHash = (torrent) => {
  const info = bencode.encode(torrent.info);
  const hash = crypto.createHash("sha1").update(info).digest();
};
