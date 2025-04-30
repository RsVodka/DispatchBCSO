const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" }
});

// 🔧 Middleware pour body JSON
app.use(express.json());

// 🌐 Sert le frontend statique
app.use(express.static(path.join(__dirname, "../frontend")));

// ✅ Test basique pour confirmer que le serveur tourne
app.get("/", (req, res) => {
  res.send("✅ Serveur en ligne !");
});

// 📡 Socket.IO
io.on("connection", (socket) => {
  console.log("🟢 Un utilisateur est connecté");

  socket.on("agent_ajoute", (agent) => {
    socket.broadcast.emit("agent_ajoute", agent);
  });

  socket.on("agent_supprime", (agentId) => {
    socket.broadcast.emit("agent_supprime", agentId);
  });

  // ... autres événements ici (vehicule_ajoute, patrouille_creee, etc.)

  socket.on("disconnect", () => {
    console.log("🔴 Un utilisateur s'est déconnecté");
  });
});

// 🚀 Lancement
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`✅ Serveur sur http://localhost:${PORT}`);
});
