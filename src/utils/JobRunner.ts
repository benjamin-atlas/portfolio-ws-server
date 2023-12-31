import { EventEmitter } from "events";
import Logger from "./Logger";

class JobRunner {
  private jobs: Function[];
  private SERVICE_INTERVAL_MILLISECONDS: number;
  private intervalHandle: NodeJS.Timeout | undefined;
  private isRunning: boolean;
  private emitter: EventEmitter;

  constructor(jobs: Function[]) {
    this.jobs = [...jobs];
    this.SERVICE_INTERVAL_MILLISECONDS = parseInt(
      process.env.SERVICE_INTERVAL_MILLISECONDS as string
    );
    this.intervalHandle = undefined;
    this.isRunning = false;
    this.emitter = new EventEmitter();

    this.run();
  }

  public run(): void {
    if (!this.isRunning) {
      // First run on initialization
      this.jobs.forEach(async (job: Function) => {
        const jobResult: any = await job();
        this.emitter.emit("jobComplete", jobResult);
        Logger.appendDebugLog("JobRunner emitting job complete.");
        Logger.appendDebugLog("Job result:");
        Logger.appendDebugLog(JSON.stringify(jobResult, null, 2));
      });

      this.intervalHandle = setInterval(() => {
        this.jobs.forEach(async (job: Function) => {
          const jobResult: any = await job();
          this.emitter.emit("jobComplete", jobResult);
          Logger.appendDebugLog("JobRunner emitting job complete.");
          Logger.appendDebugLog("Job result:");
          Logger.appendDebugLog(JSON.stringify(jobResult, null, 2));
        });
      }, this.SERVICE_INTERVAL_MILLISECONDS);

      this.isRunning = true;
    }
  }

  public stop(): void {
    if (this.isRunning) {
      clearInterval(this.intervalHandle);
      this.isRunning = false;
    }
  }

  public getEmitter(): EventEmitter {
    return this.emitter;
  }
}

export default JobRunner;
