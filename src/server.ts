import { Socket } from "dgram";
import { Server } from "ws";
import PortfolioWsMessage from "./types/PortfolioWsMessage";
import PortfolioWsMessageType from "./types/PortfolioWsMessageType";
import CommandProcessor from "./factories/CommandProcessor";
import GithubCommandProcessorFactory from "./factories/GithubStatsCommandProcessorFactory";

const server: Server = new Server({ port: 8080 });

server.on("connection", (socket: Socket) => {
  console.log("Client connected");

  socket.on("message", (message: string) => {
    const pfwsMessage: PortfolioWsMessage = JSON.parse(
      message
    ) as PortfolioWsMessage;
    console.log(`Received message of type: ${pfwsMessage.messageType}`);
    console.log(
      `Received message with body: ${JSON.stringify(pfwsMessage.body, null, 2)}`
    );

    let commandProcessor: CommandProcessor | null = null;

    let invalidType: boolean = false;
    switch (pfwsMessage.messageType) {
      case PortfolioWsMessageType.GithubStats:
        commandProcessor =
          new GithubCommandProcessorFactory().createCommandProcessor();
        break;
      default:
        socket.send(
          `Invalid message type received. Received "${pfwsMessage.messageType}".`
        );
        invalidType = true;
    }

    if (!invalidType) {
      console.log(
        `Created command processor of type [${pfwsMessage.messageType}]`
      );
    }

    commandProcessor?.processCommand();

    // Send a response back to the client
    socket.send(`Message received!`);
  });

  socket.on("close", () => {
    console.log("Client disconnected");
  });
});
