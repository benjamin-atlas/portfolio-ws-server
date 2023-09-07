import { WebSocket } from "ws";
import GithubCommandProps from "../types/GithubCommandProps";
import CommandProcessor from "./CommandProcessor";
import axios from "axios";

class GithubStatsCommandProcessor extends CommandProcessor {
  constructor(private props: GithubCommandProps) {
    super();
  }

  processCommand(): void {
    const { socket }: { socket: WebSocket } = this.props;
    const GH_API_KEY_1: string | undefined = process.env.GH_API_KEY_1;
    const GH_USERNAME_1: string | undefined = process.env.GH_USERNAME_1;

    console.log(`API KEY: ${GH_API_KEY_1}, API USER: ${GH_USERNAME_1}`);

    const intervalHandle: NodeJS.Timeout = setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) {
        if (GH_API_KEY_1 && GH_USERNAME_1) {
          getCommitCountForUser(GH_USERNAME_1, GH_API_KEY_1).then(
            (totalCommitCount: number) => {
              socket.send(
                `Total commits across all repos for [${GH_USERNAME_1}]: ${totalCommitCount}`
              );
            }
          );
        }
      } else {
        console.log("Clearing interval");
        clearInterval(intervalHandle);
      }
    }, 30000);

    async function getCommitCountForUser(username: string, token: string) {
      try {
        // Fetch the list of repositories for the user
        const userRepositoriesResponse = await axios.get(
          `https://api.github.com/user/repos`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const userRepositories = userRepositoriesResponse.data;

        let totalCommitCount = 0;

        // Iterate through the user's repositories
        for (const repo of userRepositories) {
          // Fetch commits for each repository
          const commitsResponse = await axios.get(`${repo.url}/commits`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          console.log(
            `Commit count for repo [${repo.url}]: ${commitsResponse.data.length}`
          );

          const commitCount = commitsResponse.data.length;
          totalCommitCount += commitCount;
        }

        return totalCommitCount;
      } catch (error) {
        throw error;
      }
    }
  }
}

export default GithubStatsCommandProcessor;
