const socket = require('socket.io');
const express = require('express');
const peer = require('peer');
const https = require('https');
const fs = require('fs');
const PORT = 3000;
//fs.readFileSync('./../certificates/key.key', 'utf8')
const privateKey  = fs.readFileSync('./../certificates/key.pem', 'utf8')
const certificate = fs.readFileSync('./../certificates/cert.pem', 'utf8') 
const expressApp = express();
const credentials = {key: privateKey, cert: certificate};
const expressServer = https.Server(credentials,expressApp);
const socketServer = socket(expressServer, {
  path: '/socket.io',
  cors: {
    origin: "https://healthit.in.ua",
    methods: ["GET", "POST"]
  }
});
const peerServer = peer.ExpressPeerServer(expressServer, { debug: true });
// View engine setup
expressApp.set('view engine', 'ejs');

expressApp.use(express.static('public'))

expressApp.use('/peerjs', peerServer)
expressApp.get('/call/:streamId', (req, res) => {
  console.log(req.params)
 res.render('call', { streamId: req.params.streamId });
});

expressApp.get('/call/', (req, res) => {
  res.render('session');
});
 
expressServer.listen(PORT, (err) => {
  if (err) console.log(err);
  console.log(`Server running at https://localhost:${PORT}`);
})

socketServer.on("connection", (socket) => {
  socket.on('join-room', (roomId, peerId) => {
    console.log('someone joined the room ', roomId, peerId);
    socket.join(roomId);
    socket.to(roomId).emit('user-connected', peerId);
  });
  socket.on('share_display', (roomId, stream) => {
   console.log('stream')
  })
});