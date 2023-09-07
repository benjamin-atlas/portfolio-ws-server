import CommandProcessor from "./CommandProcessor";

class GithubStatsCommandProcessor extends CommandProcessor {
  processCommand(): void {
    console.log("Should process github command");
  }
}

export default GithubStatsCommandProcessor;
