const dgram = require("dgram");
const Buffer = require("buffer").Buffer;

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
  //...
}

function parseConnectResponse(resp) {
  //...
}

function buildAnnounceRequest(connId) {
  // ...
}

function parseAnnounceResponse(resp) {
  // ...
}
