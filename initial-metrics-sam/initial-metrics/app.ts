import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ApiGatewayManagementApi } from 'aws-sdk';

export const lambdaHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        console.log(`Hello, I'm the metrics initial response. Connection ID ${event.requestContext.connectionId ?? ""}. You said: ${JSON.stringify(event.body)}`)
        const apigatewaymanagementapi = new ApiGatewayManagementApi({ endpoint: 'https://t7kzuciz99.execute-api.us-east-1.amazonaws.com/production', });

        console.log("Api gateway instantiated.");

        await apigatewaymanagementapi.postToConnection({ ConnectionId: event.requestContext.connectionId ?? "", Data: JSON.stringify({
            message: 'hello world you saucy bum',
        })}).promise();
        console.log("postToConnection awaited.");

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'hello world',
            }),
        };
    } catch (err) {
        console.log(err);
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'some error happened',
            }),
        };
    }
};
