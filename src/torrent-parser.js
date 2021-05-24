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
  return hash;
};

module.exports.BLOCK_LEN = Math.pow(2, 14);

module.exports.pieceLen = (torrent, pieceIndex) => {
  const totalLength = bignum.fromBuffer(this.size(torrent)).toNumber();
  const pieceLength = torrent.info["piece length"];

  const lastPieceLength = totalLength % pieceLength;

  if (lastPieceLength) {
    const lastPieceIndex = Math.floor(totalLength / pieceLength);

    return lastPieceIndex === pieceIndex ? lastPieceLength : pieceLength;
  } else {
    return pieceLength;
  }
};

module.exports.blocksPerPiece = (torrent, pieceIndex) => {
  const pieceLength = this.pieceLen(torrent, pieceIndex);
  return Math.ceil(pieceLength / this.BLOCK_LEN);
};

module.exports.blockLen = (torrent, pieceIndex, blockIndex) => {
  const pieceLength = this.pieceLen(torrent, pieceIndex);

  const lastBlockLength = pieceLength % this.BLOCK_LEN;
  if (lastBlockLength) {
    const lastBlockIndex = Math.floor(pieceLength / this.BLOCK_LEN);

    return lastBlockIndex === pieceIndex ? lastBlockLength : this.BLOCK_LEN;
  } else {
    return this.BLOCK_LEN;
  }
};
