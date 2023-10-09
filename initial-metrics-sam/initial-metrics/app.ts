import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ApiGatewayManagementApi } from 'aws-sdk';
import Storage from './utils/Storage';
import GithubMetrics from './types/GithubMetrics';
import Logger from './utils/Logger';

export const lambdaHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        Logger.appendLog(`Hello, I'm the metrics initial response. Connection ID ${event.requestContext.connectionId ?? ""}. You said: ${JSON.stringify(event.body)}`)
        try {
            await Storage.load();
        } catch (error: any) {
            Logger.appendError(error);
            throw new Error('Could not initialize gh-metrics-store connection.');
        }

        const apigatewaymanagementapi = new ApiGatewayManagementApi({ endpoint: 'https://t7kzuciz99.execute-api.us-east-1.amazonaws.com/production', });
        Logger.appendLog("Api gateway instantiated.");

        const metrics: GithubMetrics = await Storage.get(`metrics`);

        await apigatewaymanagementapi.postToConnection({ ConnectionId: event.requestContext.connectionId ?? "", Data: JSON.stringify(metrics)}).promise();
        Logger.appendLog("postToConnection awaited.");

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'hello world',
            }),
        };
    } catch (err: any) {
        Logger.appendError(err);
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'some error happened',
            }),
        };
    }
};
