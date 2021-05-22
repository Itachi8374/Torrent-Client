const dgram = require("dgram");
const Buffer = require("buffer").Buffer;
const crypto = require("crypto");
const util = require("./util");
const torrentParser = require("./torrent-parser");

module.exports.getPeers = (torrent, callback) => {
  const socket = dgram.createSocket("udp4");
  const url = torrent.announce.toString("utf8");

  //1. Send Connection Request
  handleUDPSend(socket, buildConnectRequest(), url);

  socket.on("message", (resp) => {
    if (responseType(resp) == "connect") {
      //2. Receive and Parse connection response
      const connResp = parseConnectResponse(resp);
      //3. Send Announce Request
      const announceReq = buildAnnounceRequest(connResp.connectionId, torrent);
      handleUDPSend(socket, announceReq, url);
    } else if (responseType(resp) == "announce") {
      //4. Parse Announce resp
      const announceResp = parseAnnounceResponse(resp);
      //5. pass peers to callback
      callback(announceResp.peers);
    }
  });
};

function handleUDPSend(socket, message, rawURL, callback = () => {}) {
  const url = new URL(rawURL);
  socket.send(message, url.port, url.host, callback);
}

function responseType(resp) {
  const action = resp.readUInt32BE(0);
  if (action === 0) {
    return "connect";
  }
  if (action === 1) {
    return "announce";
  }
}

function buildConnectRequest() {
  const buf = Buffer.alloc(16);

  //connection id
  buf.writeUInt32BE(0x417, 0);
  buf.writeUInt32BE(0x27101980, 4);
  //action
  buf.writeUInt32BE(0, 8);
  //transaction id
  crypto.randomBytes(4).copy(buf, 12);
  return buf;
}

function parseConnectResponse(resp) {
  return {
    action: resp.readUInt32BE(0),
    transaction_id: resp.readUInt32BE(4),
    connection_id: resp.slice(8),
  };
}

function buildAnnounceRequest(connId, torrent, port = 6881) {
  const buf = Buffer.alloc(98);

  //connection id
  connId.copy(buf, 0);
  //action id
  buf.writeUInt32BE(1, 8);
  //transaction id
  crypto.randomBytes(4).copy(buf, 12);
  //info hash
  torrentParser.infoHash(torrent).copy(buf, 16);
  //peer id
  util.genId().copy(buf, 36);
  //downloaded
  Buffer.alloc(8).copy(buf, 56);
  //left
  torrentParser.size(torrent).copy(buf, 64);
  //uploaded
  Buffer.alloc(8).copy(buf, 72);
  // event
  buf.writeUInt32BE(0, 80);
  // ip address
  buf.writeUInt32BE(0, 80);
  // key
  crypto.randomBytes(4).copy(buf, 88);
  // num want
  buf.writeInt32BE(-1, 92);
  // port
  buf.writeUInt16BE(port, 96);

  return buf;
}

function parseAnnounceResponse(resp) {
  function group(iterable, groupSize) {
    let groups = [];
    for (let i = 0; i < iterable.length; i += groupSize) {
      groups.push(iterable.slice(i, i + groupSize));
    }
    return groups;
  }

  return {
    action: resp.readUInt32BE(0),
    transaction_id: resp.readUInt32BE(4),
    interval: resp.readUInt32BE(8),
    leechers: resp.readUInt32BE(12),
    seeders: resp.readUInt32BE(16),
    peers: groups(resp.slice(20), 6).map((address) => {
      return {
        ip: address.slice(0, 4).join("."),
        port: address.readUInt32BE(4),
      };
    }),
  };
}
