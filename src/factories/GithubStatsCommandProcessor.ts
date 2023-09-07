import { WebSocket } from "ws";
import GithubCommandProps from "../types/GithubCommandProps";
import CommandProcessor from "./CommandProcessor";

class GithubStatsCommandProcessor extends CommandProcessor {
  constructor(private props: GithubCommandProps) {
    super();
  }

  processCommand(): void {
    const { socket }: { socket: WebSocket } = this.props;

    const intervalHandle: NodeJS.Timeout = setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) {
        // fetch github stats and return them
      } else {
        console.log("Clearing interval");
        clearInterval(intervalHandle);
      }
    }, 2000);
  }
}

export default GithubStatsCommandProcessor;
