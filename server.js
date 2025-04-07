// server/signaling-server.js
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 3001 });

const rooms = new Map();

wss.on('connection', (socket) => {
  let currentRoom = null;
  console.log('🔌 New WebSocket connection');

  socket.on('message', (msg) => {
    const data = JSON.parse(msg);

    if (data.type === 'join') {
        currentRoom = data.room;
        if (!rooms.has(currentRoom)) rooms.set(currentRoom, []);
        rooms.get(currentRoom).push(socket);
        console.log(`👥 Socket joined room: ${currentRoom}`);
      
        // Notify everyone in the room
        const peers = rooms.get(currentRoom);
        peers.forEach((peer) => {
          if (peer !== socket && peer.readyState === WebSocket.OPEN) {
            peer.send(JSON.stringify({ type: 'peer-joined' }));
          }
        });
      }

    if (data.type === 'signal' && currentRoom) {
        const peers = rooms.get(currentRoom) || [];
        
        if (peers.length < 2) {
          console.log(`⚠️ Not enough peers in room ${currentRoom}, skipping signal`);
          return;
        }
      
        console.log(`📡 Broadcasting signal in room ${currentRoom}`);
        peers.forEach((peer) => {
          if (peer !== socket && peer.readyState === WebSocket.OPEN) {
            peer.send(JSON.stringify(data.data));
          }
        });
      }
      
  });

  socket.on('close', () => {
    if (currentRoom) {
      rooms.set(currentRoom, (rooms.get(currentRoom) || []).filter((s) => s !== socket));
      console.log(`❌ Socket disconnected from room: ${currentRoom}`);
    }
  });
});