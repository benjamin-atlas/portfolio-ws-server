import { Socket } from "dgram";
import { Server } from "ws";

const server: Server = new Server({ port: 8080 });

server.on("connection", (socket: Socket) => {
  console.log("Client connected");

  socket.on("message", (message: string) => {
    console.log(`Received: ${message}`);

    // Send a response back to the client
    socket.send(`Server received: ${message}`);
  });

  socket.on("close", () => {
    console.log("Client disconnected");
  });
});
