import { WebSocket } from "ws";
import GithubCommandProps from "../types/GithubCommandProps";
import CommandProcessor from "./CommandProcessor";
import GithubMetrics from "../types/GithubMetrics";
import Logger from "../utils/Logger";
import Storage from "../utils/Storage";

class GithubStatsCommandProcessor extends CommandProcessor {
  constructor(private props: GithubCommandProps) {
    super();
  }

  processCommand(): void {
    const { socket }: { socket: WebSocket } = this.props;

    Logger.appendDebugLog("GHS socket command processing...");

    Storage.get("metrics").then((storedMetrics: GithubMetrics) => {
      if (socket.readyState === WebSocket.OPEN && storedMetrics) {
        Logger.appendDebugLog("Sending stored metrics");
        Logger.appendDebugLog(JSON.stringify(storedMetrics, null, 2));
        socket.send(JSON.stringify(storedMetrics));
      } else {
        Logger.appendDebugLog("No stored metrics to send");
      }
    });

    this.props.jobRunnerEmitter.on("jobComplete", (metrics: GithubMetrics) => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(metrics));
      }
    });
  }
}

export default GithubStatsCommandProcessor;
