import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import Logger from './utils/Logger';
import * as AWS from 'aws-sdk';

export const lambdaHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        Logger.appendLog(`Connect happens. Connection ID: ${event.requestContext.connectionId ?? ""}`);

        try {
            const dynamoDB: AWS.DynamoDB.DocumentClient = new AWS.DynamoDB.DocumentClient();

            await dynamoDB
                .put({
                    TableName: 'portfolio-ws-connection-log',
                    Item: {
                        connection_id: event.requestContext.connectionId
                    },
                })
                .promise();
        } catch (error: any) {
            Logger.appendError(error);
            throw new Error('Could not track connection in portfolio-ws-connection-log.');
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
