import { WebSocketServer, WebSocket } from "ws";
import PortfolioWsMessage from "./types/PortfolioWsMessage";
import PortfolioWsMessageType from "./types/PortfolioWsMessageType";
import CommandProcessor from "./factories/CommandProcessor";
import GithubCommandProcessorFactory from "./factories/GithubStatsCommandProcessorFactory";
import { config } from "dotenv";
import Logger from "./utils/Logger";
import JobRunner from "./utils/JobRunner";
import { getGHUserMetrics } from "./utils/GithubCommands";
import EventEmitter = require("events");
import GithubMetrics from "./types/GithubMetrics";
import Storage from "./utils/Storage";

config();

Logger.appendDebugLog("Application Started.");

const server: WebSocketServer = new WebSocketServer({ port: 8080 });

const GH_API_KEY_1: string = process.env.GH_API_KEY_1 as string;
const GH_USERNAME_1: string = process.env.GH_USERNAME_1 as string;
const GH_API_KEY_2: string = process.env.GH_API_KEY_2 as string;
const GH_USERNAME_2: string = process.env.GH_USERNAME_2 as string;

const jobRunner: JobRunner = new JobRunner([
  async () => {
    const job1Results: GithubMetrics = await getGHUserMetrics(
      GH_USERNAME_1,
      GH_API_KEY_1
    );
    const job2Results: GithubMetrics = await getGHUserMetrics(
      GH_USERNAME_2,
      GH_API_KEY_2
    );

    const aggregateMetrics: GithubMetrics = {
      commits: job1Results.commits + job2Results.commits,
      mergedPRs: job1Results.mergedPRs + job2Results.mergedPRs,
      linesOfCodeWritten:
        job1Results.linesOfCodeWritten + job2Results.linesOfCodeWritten,
      repositoriesContributed:
        job1Results.repositoriesContributed +
        job2Results.repositoriesContributed,
    };

    Storage.store("metrics", aggregateMetrics);

    return aggregateMetrics;
  },
]);

const jobRunnerEmitter: EventEmitter = jobRunner.getEmitter();

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
          jobRunnerEmitter,
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
