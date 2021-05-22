const dgram = require("dgram");
const Buffer = require("buffer").Buffer;
const crypto = require("crypto");

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
      const announceReq = buildAnnounceRequest(connResp.connectionId);
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

function responseType() {
  // ...
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

function buildAnnounceRequest(connId) {
  // ...
}

function parseAnnounceResponse(resp) {
  // ...
}
