import { EventEmitter } from "events";

class JobRunner {
  private jobs: Function[];
  private readonly INTERVAL: number = 600000;
  private intervalHandle: NodeJS.Timeout | undefined;
  private isRunning: boolean;
  private emitter: EventEmitter;

  constructor(jobs: Function[]) {
    this.jobs = [...jobs];
    this.intervalHandle = undefined;
    this.isRunning = false;
    this.emitter = new EventEmitter();

    this.run();
  }

  public run(): void {
    if (!this.isRunning) {
      // First run on initialization
      this.jobs.forEach(async (job: Function) => {
        this.emitter.emit("jobComplete", job());
      });

      this.intervalHandle = setInterval(() => {
        this.jobs.forEach(async (job: Function) => {
          this.emitter.emit("jobComplete", await job());
        });
      }, this.INTERVAL);

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
