const net = require("net");
const Buffer = require("buffer").Buffer;
const tracker = require("./tracker");
const message = require("./message");

module.exports = (torrent) => {
  const requested = [];
  tracker.getPeers(torrent, (peers) => {
    peers.forEach((peer) => download(peer, torrent, requested));
  });
};

function download(peer, torrent, requested) {
  const socket = net.Socket();
  socket.on("error", console.log);
  socket.connect(peer.port, peer.ip, () => {
    //1.
    socket.write(message.buildHandshake(torrent));
  });
  //2.
  const queue = [];
  onWholeMsg(socket, (msg) => msgHandler(msg, socket, requested, queue));
}

function msgHandler(msg, socket, requested, queue) {
  if (isHandshake(msg)) {
    socket.write(message.buildInterested());
  } else {
    const parsedMsg = message.parse(msg);

    if (parsedMsg.id === 0) chokeHandler();
    if (parsedMsg.id === 1) unchokeHandler();
    if (parsedMsg.id === 4)
      haveHandler(parsedMsg.payload, socket, requested, queue);
    if (parsedMsg.id === 5) bitfieldHandler(parsedMsg.payload);
    if (parsedMsg.id === 7)
      pieceHandler(parsedMsg.payload, socket, requested, queue);
  }
}

function isHandshake(msg) {
  return (
    msg.length === msg.readUInt8(0) + 49 &&
    msg.toString("utf8", 1) === "BitTorrent protocol"
  );
}

function chokeHandler() {
  //...
}

function unchokeHandler() {
  //...
}

function haveHandler(payload, socket, requested, queue) {
  const pieceIndex = payload.readInt32BE(0);
  queue.push(pieceIndex);
  if(queue.length === 1){
      requestPiece(socket, requested, queue);
  }
}

function bitfieldHandler(payload) {
  //...
}

function pieceHandler(payload) {
  //...
}

function requestPiece(socket, requested, queue){
    if(requested[queue[0]]){
        queue.shift();
    } else {
        // this is pseudo-code, as buildRequest takes slightly more complex arguments
        socket.write(message.buildRequest(pieceIndex));
    }
}

function onWholeMsg(socket, callback) {
  let savedBuf = Buffer.alloc(0);
  let handshake = true;

  socket.on("data", (recvBuf) => {
    // msgLen calculates the length of a whole message
    //1. First message is handshake thereforre handshake set true
    //2. Length of handshake message is 49 bytes + length of protocol which is sotred as 8bit integer (pstrlen) at index 0
    //3. further message format <len><id><payload>
    //4. length of payload stored is variable, therefore stored in <len> <0001 + X>
    const msgLen = () =>
      handshake ? savedBuf.readUInt8(0) + 49 : savedBuf.readInt32BE(0) + 4;
    savedBuf = Buffer.concat([savedBuf, recvBuf]);

    while (savedBuf.length >= 4 && savedBuf.length >= msgLen()) {
      callback(savedBuf.slice(0, msgLen()));
      savedBuf = savedBuf.slice(msgLen());
      handshake = false;
    }
  });
}
