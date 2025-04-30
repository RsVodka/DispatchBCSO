const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" }
});

io.on("connection", (socket) => {
  console.log("🟢 Un utilisateur est connecté");

  socket.on("agent_ajoute", (agent) => {
    socket.broadcast.emit("agent_ajoute", agent);
  });

  socket.on("agent_supprime", (agentId) => {
    socket.broadcast.emit("agent_supprime", agentId);
  });

  socket.on("vehicule_ajoute", (vehicle) => {
    socket.broadcast.emit("vehicule_ajoute", vehicle);
  });

  socket.on("vehicule_supprime", (vehicleId) => {
    socket.broadcast.emit("vehicule_supprime", vehicleId);
  });

  socket.on("patrouille_creee", (patrol) => {
    socket.broadcast.emit("patrouille_creee", patrol);
  });

  socket.on("patrouille_supprimee", (patrolId) => {
    socket.broadcast.emit("patrouille_supprimee", patrolId);
  });

  socket.on("agent_retire_patrouille", ({ patrolId, agentId }) => {
    socket.broadcast.emit("agent_retire_patrouille", { patrolId, agentId });
  });

  socket.on("secteur_mis_a_jour", ({ patrolId, secteur }) => {
    socket.broadcast.emit("secteur_mis_a_jour", { patrolId, secteur });
  });

  socket.on("statut_mis_a_jour", ({ patrolId, statut }) => {
    socket.broadcast.emit("statut_mis_a_jour", { patrolId, statut });
  });

  socket.on("disconnect", () => {
    console.log("🔴 Un utilisateur s'est déconnecté");
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`✅ Socket.IO prêt sur http://localhost:${PORT}`);
});
