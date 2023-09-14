import { appendFile } from "fs/promises";
import { getCurrentDateTime } from "./DateUtility";

class Logger {
  private static readonly LOG_FILE: string = `${getCurrentDateTime()}-log.txt`;

  public static appendLog(msg: string) {
    console.log(msg);
    appendFile(this.LOG_FILE, `[LOG][${getCurrentDateTime()}]: ${msg}\n`);
  }

  public static appendDebugLog(msg: string) {
    const isDebug: boolean = process.env.DEBUG === "true";

    if (isDebug) {
      appendFile(this.LOG_FILE, `[DEBUG][${getCurrentDateTime()}]${msg}\n`);
    }
  }
}

export default Logger;
