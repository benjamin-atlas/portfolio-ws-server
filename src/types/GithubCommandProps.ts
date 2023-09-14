import { EventEmitter } from "stream";
import { WebSocket } from "ws";

interface GithubCommandProps {
  socket: WebSocket;
  jobRunnerEmitter: EventEmitter;
}

export default GithubCommandProps;
