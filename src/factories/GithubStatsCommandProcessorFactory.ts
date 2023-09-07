import CommandProcessor from "./CommandProcessor";
import CommandProcessorFactory from "./CommandProcessorFactory";
import GithubStatsCommandProcessor from "./GithubStatsCommandProcessor";

class GithubCommandProcessorFactory implements CommandProcessorFactory {
  createCommandProcessor(): CommandProcessor {
    return new GithubStatsCommandProcessor();
  }
}

export default GithubCommandProcessorFactory;
