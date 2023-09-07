import GithubCommandProps from "../types/GithubCommandProps";
import CommandProcessor from "./CommandProcessor";
import CommandProcessorFactory from "./CommandProcessorFactory";
import GithubStatsCommandProcessor from "./GithubStatsCommandProcessor";

class GithubCommandProcessorFactory implements CommandProcessorFactory {
  constructor(private props: GithubCommandProps) {}

  createCommandProcessor(): CommandProcessor {
    return new GithubStatsCommandProcessor(this.props);
  }
}

export default GithubCommandProcessorFactory;
