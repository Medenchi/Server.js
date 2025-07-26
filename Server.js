const WebSocket = require('ws');
const express = require('express');
const http = require('http');

const app = express();
// Мы создаем HTTP сервер и передаем ему наше Express приложение
const server = http.createServer(app);
// Теперь WebSocket сервер будет работать на том же порту, что и HTTP
const wss = new WebSocket.Server({ server });

let streamer = null;
const viewers = new Set();

console.log('Сервер запускается...');

wss.on('connection', ws => {
    const connectionType = ws.protocol;

    if (connectionType === 'streamer') {
        if (streamer) {
            console.log('Другой стример уже подключен. Отключаем нового.');
            ws.close();
            return;
        }
        console.log('✅ Стример подключился!');
        streamer = ws;
        ws.on('close', () => {
            console.log('❌ Стример отключился.');
            streamer = null;
            viewers.forEach(viewer => viewer.send('stream_ended'));
        });
    } else {
        console.log('✅ Зритель подключился!');
        viewers.add(ws);
        ws.on('close', () => {
            console.log('❌ Зритель отключился.');
            viewers.delete(ws);
        });
    }

    ws.on('message', message => {
        if (ws === streamer) {
            viewers.forEach(viewer => {
                if (viewer.readyState === WebSocket.OPEN) {
                    viewer.send(message);
                }
            });
        }
    });
});

// Это нужно, чтобы Render понимал, что сервис жив и здоров
app.get('/', (req, res) => {
  res.send('Stream server is running!');
});

// Render предоставит порт через переменную окружения PORT
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Сервер слушает на порту ${PORT}`);
});
