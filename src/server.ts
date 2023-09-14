import { WebSocketServer, WebSocket } from "ws";
import PortfolioWsMessage from "./types/PortfolioWsMessage";
import PortfolioWsMessageType from "./types/PortfolioWsMessageType";
import CommandProcessor from "./factories/CommandProcessor";
import GithubCommandProcessorFactory from "./factories/GithubStatsCommandProcessorFactory";
import { config } from "dotenv";
import Logger from "./utils/Logger";

const server: WebSocketServer = new WebSocketServer({ port: 8080 });
config();

Logger.appendDebugLog("Application Started.");

server.on("connection", (socket: WebSocket) => {
  Logger.appendLog("Client connected");

  socket.on("message", (message: string) => {
    const pfwsMessage: PortfolioWsMessage = JSON.parse(
      message
    ) as PortfolioWsMessage;
    Logger.appendDebugLog(
      `Received message of type: ${pfwsMessage.messageType}`
    );
    Logger.appendDebugLog(
      `Received message with body: ${JSON.stringify(pfwsMessage.body, null, 2)}`
    );

    let commandProcessor: CommandProcessor | null = null;

    let invalidType: boolean = false;
    switch (pfwsMessage.messageType) {
      case PortfolioWsMessageType.GithubStats:
        commandProcessor = new GithubCommandProcessorFactory({
          socket,
        }).createCommandProcessor();
        break;
      default:
        socket.send(
          `Invalid message type received. Received "${pfwsMessage.messageType}".`
        );
        invalidType = true;
    }

    if (!invalidType) {
      Logger.appendDebugLog(
        `Created command processor of type [${pfwsMessage.messageType}]`
      );
    }

    commandProcessor?.processCommand();

    // Send a response back to the client
    socket.send(`Message received!`);
  });

  socket.on("close", () => {
    Logger.appendLog("Client disconnected");
  });
});
