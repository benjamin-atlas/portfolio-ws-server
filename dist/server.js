"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = require("ws");
const server = new ws_1.Server({ port: 8080 });
server.on("connection", (socket) => {
    console.log("Client connected");
    socket.on("message", (message) => {
        console.log(`Received: ${message}`);
        // Send a response back to the client
        socket.send(`Server received: ${message}`);
    });
    socket.on("close", () => {
        console.log("Client disconnected");
    });
});
