import { WebSocket } from "ws";
import GithubCommandProps from "../types/GithubCommandProps";
import CommandProcessor from "./CommandProcessor";
import axios, { AxiosHeaders, AxiosResponse } from "axios";
import GithubMetrics from "../types/GithubMetrics";

class GithubStatsCommandProcessor extends CommandProcessor {
  constructor(private props: GithubCommandProps) {
    super();
  }

  processCommand(): void {
    const { socket }: { socket: WebSocket } = this.props;
    const GH_API_KEY_1: string | undefined = process.env.GH_API_KEY_1;
    const GH_USERNAME_1: string | undefined = process.env.GH_USERNAME_1;
    const GH_API_KEY_2: string | undefined = process.env.GH_API_KEY_2;
    const GH_USERNAME_2: string | undefined = process.env.GH_USERNAME_2;

    const intervalHandle: NodeJS.Timeout = setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) {
        if (GH_API_KEY_1 && GH_USERNAME_1) {
          getGHUserMetrics(GH_USERNAME_1, GH_API_KEY_1).then(
            (metrics: GithubMetrics) => {
              socket.send(JSON.stringify(metrics));
            }
          );
        }
        if (GH_API_KEY_2 && GH_USERNAME_2) {
          getGHUserMetrics(GH_USERNAME_2, GH_API_KEY_2).then(
            (metrics: GithubMetrics) => {
              socket.send(JSON.stringify(metrics));
            }
          );
        }
      } else {
        console.log("Clearing interval");
        clearInterval(intervalHandle);
      }
    }, 30000);

    async function getGHUserMetrics(
      username: string,
      token: string
    ): Promise<GithubMetrics> {
      const headers: any = {
        Authorization: `Bearer ${token}`,
      };

      const metrics: GithubMetrics = new GithubMetrics();

      try {
        // Fetch the list of repositories for the user
        const userRepositoriesResponse = await axios.get(
          `https://api.github.com/user/repos`,
          {
            headers: headers,
          }
        );

        const userRepositories = userRepositoriesResponse.data;

        metrics.commits = await getCommitsForUser(
          username,
          userRepositories,
          headers
        );
        metrics.mergedPRs = await getPRsMergedForUser(
          username,
          userRepositories,
          headers
        );
        metrics.linesOfCodeWritten = await getLinesOfCodeWrittenForUser(
          username,
          userRepositories,
          headers
        );
        metrics.repositoriesContributed =
          await getRepositoriesContributedForUser(
            username,
            userRepositories,
            headers
          );
      } catch (error) {
        console.error(`[Error] Error getting github metrics:  ${error}`);
      }

      return metrics;
    }

    async function getCommitsForUser(
      username: string,
      repositories: any[],
      authHeaders: AxiosHeaders
    ): Promise<number> {
      let totalCommits: number = 0;

      for (const repo of repositories) {
        let commitsResponse: AxiosResponse<any, any>;
        let numberOfCommitsOnPage: number = 0;
        let pageNumber: number = 0;

        do {
          try {
            pageNumber++;
            numberOfCommitsOnPage = 0;

            // TODO, if you save the commit count from last time, theoretically you know the last page you should start the next time you fetch, which will save hella queries.
            commitsResponse = await axios.get(
              `${repo.url}/commits?author=${username}&per_page=100&page=${pageNumber}`,
              {
                headers: authHeaders,
              }
            );
            numberOfCommitsOnPage = commitsResponse.data.length;
          } catch (error) {
            // TODO: I don't love how this behaves on error with the page number logic (what if it errors over and over?), but don't have the time to fix it right now.
            console.error(
              `[ERROR] Error getting commit count for page [${repo.url}/commits?author=${username}&per_page=100&page=${pageNumber}]:  ${error}`
            );
          }
        } while (numberOfCommitsOnPage === 100);

        const commitCount = 100 * (pageNumber - 1) + numberOfCommitsOnPage;
        totalCommits += commitCount;
      }

      return totalCommits;
    }

    async function getPRsMergedForUser(
      username: string,
      repositories: any[],
      authHeaders: AxiosHeaders
    ): Promise<number> {
      return 0;
    }

    async function getLinesOfCodeWrittenForUser(
      username: string,
      repositories: any[],
      authHeaders: AxiosHeaders
    ): Promise<number> {
      return 0;
    }

    async function getRepositoriesContributedForUser(
      username: string,
      repositories: any[],
      authHeaders: AxiosHeaders
    ): Promise<number> {
      return 0;
    }
  }
}

export default GithubStatsCommandProcessor;
