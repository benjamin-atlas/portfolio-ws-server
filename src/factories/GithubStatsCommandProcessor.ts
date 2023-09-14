import { WebSocket } from "ws";
import GithubCommandProps from "../types/GithubCommandProps";
import CommandProcessor from "./CommandProcessor";
import axios, { AxiosHeaders, AxiosResponse } from "axios";
import GithubMetrics from "../types/GithubMetrics";
import Logger from "../utils/Logger";

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
        Logger.appendDebugLog("Clearing interval for GH command processor.");
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
            headers,
          }
        );

        const userRepositories = userRepositoriesResponse.data;

        [
          metrics.commits,
          metrics.mergedPRs,
          metrics.linesOfCodeWritten,
          metrics.repositoriesContributed,
        ] = await Promise.all([
          getCommitsForUser(username, userRepositories, headers),
          getPRsMergedForUser(username, userRepositories, headers),
          getLinesOfCodeWrittenForUser(username, userRepositories, headers),
          getRepositoriesContributedForUser(userRepositories),
        ]);
      } catch (error) {
        Logger.appendError(`Error getting github metrics:  ${error}`);
      }

      return metrics;
    }

    async function getCommitsForUser(
      username: string,
      repositories: any[],
      headers: AxiosHeaders
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
                headers,
              }
            );
            numberOfCommitsOnPage = commitsResponse.data.length;
          } catch (error) {
            // TODO: I don't love how this behaves on error with the page number logic (what if it errors over and over?), but don't have the time to fix it right now.
            Logger.appendError(
              `Error getting commit count for page [${repo.url}/commits?author=${username}&per_page=100&page=${pageNumber}]:  ${error}`
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
      headers: AxiosHeaders
    ): Promise<number> {
      let totalPrs: number = 0;

      for (const repo of repositories) {
        let pullsResponse: AxiosResponse<any, any> | null = null;
        let numberOfRelevantPRsOnPage: number = 0;
        let pageNumber: number = 0;
        let prsPerRepo: number = 0;

        do {
          try {
            pageNumber++;
            numberOfRelevantPRsOnPage = 0;

            // TODO, if you save the last page number, you know where you should start the next time you fetch, which will save hella queries.
            pullsResponse = await axios.get(
              `${repo.url}/pulls?author=${username}&state=all&per_page=100&page=${pageNumber}`,
              {
                headers,
              }
            );
            numberOfRelevantPRsOnPage = pullsResponse?.data.reduce(
              (numPrs: number, pr: any) =>
                pr.user.login === username ||
                pr.assignees.some(
                  (assignee: any) => assignee.login === username
                ) ||
                pr.requested_reviewers.some(
                  (reviewer: any) => reviewer.login === username
                )
                  ? numPrs + 1
                  : numPrs,
              0
            );

            prsPerRepo += numberOfRelevantPRsOnPage;
          } catch (error) {
            // TODO: I don't love how this behaves on error with the page number logic (what if it errors over and over?), but don't have the time to fix it right now.
            Logger.appendError(
              `Error getting PR count for page [${repo.url}/pulls?author=${username}&state=all&per_page=100&page=${pageNumber}]:  ${error}`
            );
          }
        } while (pullsResponse?.data.length === 100);

        totalPrs += prsPerRepo;
      }

      return totalPrs;
    }

    async function getLinesOfCodeWrittenForUser(
      username: string,
      repositories: any[],
      headers: AxiosHeaders
    ): Promise<number> {
      let totalLinesOfCodeWritten: number = 0;

      for (const repo of repositories) {
        try {
          let response: AxiosResponse = await axios.get(
            `https://api.github.com/repos/${repo.owner.login}/${repo.name}/stats/contributors`,
            {
              headers,
            }
          );

          if (response.status === 202) {
            // Repeatedly query again until either 200 or something besides the repeat status code.
            await new Promise<void>(
              (repeatQueryResolver, repeatQueryRejector) => {
                const intervalID: NodeJS.Timeout = setInterval(async () => {
                  response = await axios.get(
                    `https://api.github.com/repos/${repo.owner.login}/${repo.name}/stats/contributors`,
                    {
                      headers,
                    }
                  );

                  if (response.status === 200) {
                    repeatQueryResolver();
                    clearInterval(intervalID);
                  } else if (response.status !== 202) {
                    repeatQueryRejector();
                    clearInterval(intervalID);
                  }
                }, 5000);
              }
            );
          }

          if (response.status === 200) {
            const contributorsData = response.data;

            if (contributorsData && contributorsData.find) {
              const userContributions = contributorsData.find(
                (contributor: any) => contributor.author.login === username
              )?.weeks;

              if (userContributions) {
                const userLinesOfCodeForRepo: number = userContributions.reduce(
                  (total: number, week: any) => total + week.a - week.d,
                  0
                );
                totalLinesOfCodeWritten += userLinesOfCodeForRepo;
              }
            }
          } else {
            Logger.appendError(
              `Error getting lines written count for page [https://api.github.com/repos/${repo.owner.login}/${repo.name}/stats/contributors]. HTTP Response Code [${response.status}]`
            );
          }
        } catch (error) {
          Logger.appendError(
            `Error getting lines written count for page [https://api.github.com/repos/${repo.owner.login}/${repo.name}/stats/contributors]: ${error}`
          );
        }
      }
      return totalLinesOfCodeWritten;
    }

    async function getRepositoriesContributedForUser(
      repositories: any[]
    ): Promise<number> {
      return repositories.length ?? 0;
    }
  }
}

export default GithubStatsCommandProcessor;
