import CommandProcessor from "./CommandProcessor";

interface CommandProcessorFactory {
  createCommandProcessor(): CommandProcessor;
}

export default CommandProcessorFactory;
