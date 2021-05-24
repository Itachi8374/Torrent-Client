const net = require("net");
const Buffer = require("buffer").Buffer;
const tracker = require("./tracker");

module.exports = (torrent) => {
  tracker.getPeers(torrent, (peers) => {
    peers.forEach(download);
  });
};

function download(peer) {
  const socket = net.Socket();
  socket.on("error", console.log);
  socket.connect(peer.port, peer.ip, () => {
    //socket.write.. write message here
  });
  onWholeMsg(socket, (data) => {
    // handle response here
  });
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
