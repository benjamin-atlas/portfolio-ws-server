import { constants } from "fs";
import { access, readFile, writeFile } from "fs/promises";
import Logger from "./Logger";

class Storage {
  private static readonly DATASTORE_FILE: string = "datastore.json";
  private static values: any = {};
  private static isLoaded: boolean;

  public static async load(): Promise<boolean> {
    try {
      try {
        await access(this.DATASTORE_FILE, constants.F_OK);
      } catch (error: any) {
        if (error.code === "ENOENT") {
          Logger.appendDebugLog(
            `Storage file [${this.DATASTORE_FILE}] does not exist. Creating...`
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

  public static async get(key: string): Promise<any> {
    if (!this.isLoaded) {
      const success: boolean = await this.load();

      if (!success) {
        Logger.appendError(
          `Unable to load to fetch value [${key}] from storage.`
        );
      }
    }

    return this.values[key];
  }

  public static async store(key: string, value: any): Promise<void> {
    if (!this.isLoaded) {
      const success: boolean = await this.load();

      if (!success) {
        Logger.appendError(
          `Unable to load to fetch value [${key}] from storage.`
        );
      }
    }

    try {
      this.values[key] = value;
      await writeFile(this.DATASTORE_FILE, JSON.stringify(this.values));
    } catch (error: any) {
      Logger.appendError(error.toString());
    }
  }
}

export default Storage;
