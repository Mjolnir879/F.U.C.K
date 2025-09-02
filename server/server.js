import http from 'http';
import { Server } from "socket.io";
import os from 'os';

// --- Importe suas classes do jogo ---
import { Entity, EControl } from './models/Entity.js';
import Player from './models/Entities/Player.js';
import Mob from './models/Entities/Mob.js';
// ... outras classes

// --- Configuração do Servidor ---
const httpServer = http.createServer();
const io = new Server(httpServer, {
    cors: {
        origin: "*", // Permite conexões de qualquer origem (útil para desenvolvimento)
    }
});

const PORT = 8080;

// --- Lógica para encontrar o IP da LAN ---
const networkInterfaces = os.networkInterfaces();
let serverIp = 'localhost';
for (const name of Object.keys(networkInterfaces)) {
    for (const net of networkInterfaces[name]) {
        if (net.family === 'IPv4' && !net.internal) {
            serverIp = net.address;
            break;
        }
    }
    if (serverIp !== 'localhost') break;
}
console.log(`Servidor Socket.IO iniciado. Conecte-se em: http://${serverIp}:${PORT}`);

// --- Lógica Central do Jogo no Servidor ---
const clients = new Map();
const gameState = {
    entities: {}, // Guarda o estado de todas as entidades (players, mobs, etc)
};

// Exemplo: Adicionar um Mob ao estado do jogo
async function initMob() {
    const mob1 = new Mob(100, 150, 1);
    await mob1.init();
    const mobId = `mob_${Date.now()}`;
    gameState.entities[mobId] = {
        x: mob1.posx,
        y: mob1.posy,
        type: 'mob',
        texture_id: mob1.texture,
    };
}

// Inicializa o mob
initMob().catch(console.error);


io.on('connection', (socket) => {
    console.log(`Cliente conectado: ${socket.id}`);
    
    // Cria um novo jogador para este cliente
    const player = new Player(socket.id, socket.id);
    player.init().then(() => {
        clients.set(socket.id, { socket, player });
        gameState.entities[socket.id] = {
            id: socket.id,
            x: player.posx,
            y: player.posy,
            type: 'player',
            texture_id: 8, // ID do sprite do player (exemplo)
        };
        // Envia ao novo jogador seu ID
        socket.emit('assign_id', socket.id);
    });

    // Recebe o input do cliente
    socket.on('player_input', (data) => {
        const playerState = gameState.entities[socket.id];
        if (!playerState) return;

        // --- Lógica de Movimento (processada no servidor) ---
        const speed = 5;
        if (data.keys.up) playerState.y -= speed;
        if (data.keys.down) playerState.y += speed;
        if (data.keys.left) playerState.x -= speed;
        if (data.keys.right) playerState.x += speed;

        // Atualize a posição na instância do jogador também
        const clientData = clients.get(socket.id);
        if (clientData) {
            clientData.player.posx = playerState.x;
            clientData.player.posy = playerState.y;
        }
    });

    socket.on('disconnect', () => {
        console.log(`Cliente desconectado: ${socket.id}`);
        delete gameState.entities[socket.id];
        clients.delete(socket.id);
    });
});

// --- Game Loop do Servidor ---
function gameLoop() {
    // Lógica de atualização de Mobs, física, etc.
    // EControl.run(map);
    
    // Envia o estado do jogo para todos os clientes
    io.emit('game_state', gameState);
}

// Roda o loop do jogo a cada 16ms (~60 FPS)
setInterval(gameLoop, 16);

httpServer.listen(PORT);