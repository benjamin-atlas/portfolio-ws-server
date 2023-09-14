import { readFile, writeFile, access, constants } from "fs/promises";
import Logger from "./Logger";

class Storage {
  private readonly DATASTORE_FILE: string = "datastore.json";
  private values: any;
  private isLoaded: boolean;

  constructor() {
    this.values = {};
    this.isLoaded = false;
  }

  public async Load(): Promise<boolean> {
    try {
      try {
        await access(this.DATASTORE_FILE, constants.F_OK);
      } catch (error: any) {
        if (error.code === "ENOENT") {
          Logger.appendDebugLog(
            `Log file [${this.DATASTORE_FILE}] does not exist. Creating...`
          );
          await writeFile(this.DATASTORE_FILE, JSON.stringify({}));
        } else {
          Logger.appendError(`Error reading file: ${error.message}`);
          return false;
        }
      }
      const fileContents: string = await readFile(this.DATASTORE_FILE, "utf-8");
      this.values = JSON.parse(fileContents);
      return true;
    } catch (error: any) {
      Logger.appendLog(error.toString());
      return false;
    }
  }

  public async Get(key: string): Promise<any> {
    if (!this.isLoaded) {
      const success: boolean = await this.Load();

      if (!success) {
        Logger.appendError(
          `Unable to load to fetch value [${key}] from storage.`
        );
      }
    }

    return this.values[key];
  }

  public async Store(key: string, value: any): Promise<void> {
    try {
      this.values[key] = value;
      await writeFile(this.DATASTORE_FILE, JSON.stringify(this.values));
    } catch (error: any) {
      Logger.appendError(error.toString());
    }
  }
}

export default Storage;
