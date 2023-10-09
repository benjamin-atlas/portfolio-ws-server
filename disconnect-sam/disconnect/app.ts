import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import Logger from './utils/Logger';
import * as AWS from 'aws-sdk';

export const lambdaHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        Logger.appendLog(`Disconnect happens. Connection ID: ${event.requestContext.connectionId ?? ""}`);

        try {
            const dynamoDB: AWS.DynamoDB.DocumentClient = new AWS.DynamoDB.DocumentClient();

            if (event.requestContext.connectionId) {
                await dynamoDB
                    .delete({
                        TableName: 'portfolio-ws-connection-log',
                        Key: { connection_id: event.requestContext.connectionId }
                    })
                    .promise();
            } else {
                Logger.appendLog("No connection ID passed. Cannot remove from portfolio-ws-connection-log.")
            }
        } catch (error: any) {
            Logger.appendError(error);
            throw new Error(`Could not remove connection [${event.requestContext.connectionId ?? ""}] in portfolio-ws-connection-log.`);
        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: '',
            }),
        };
    } catch (err) {
        console.log(err);
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'An error has occured',
            }),
        };
    }
};
