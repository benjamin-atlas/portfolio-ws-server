import { appendFile } from "fs/promises";
import { getCurrentDateTime } from "./DateUtility";

class Logger {
  private static readonly LOG_FILE: string = `${getCurrentDateTime()}-log.txt`;

  public static appendLog(msg: string) {
    const formattedMsg: string = `[LOG][${getCurrentDateTime()}]: ${msg}\n`;
    console.log(formattedMsg);
    appendFile(this.LOG_FILE, formattedMsg);
  }

  public static appendError(msg: string) {
    const formattedMsg: string = `[ERROR][${getCurrentDateTime()}]: ${msg}\n`;
    console.error(formattedMsg);
    appendFile(this.LOG_FILE, formattedMsg);
  }

  public static appendDebugLog(msg: string) {
    const isDebug: boolean = process.env.DEBUG === "true";

    if (isDebug) {
      const formattedMsg: string = `[DEBUG][${getCurrentDateTime()}]${msg}\n`;
      console.log(formattedMsg);
      appendFile(this.LOG_FILE, formattedMsg);
    }
  }
}

export default Logger;
