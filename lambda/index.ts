import { APIGatewayProxyEvent } from 'aws-lambda';
import { ApiGatewayManagementApi } from 'aws-sdk';

export async function handler(event: APIGatewayProxyEvent) {
    const routeKey = event.requestContext.routeKey;
    const connectionId = event.requestContext.connectionId;

    if (!connectionId) {
        return { statusCode: 400, body: 'Connection ID is required' };
    }

    const endpoint = `https://${event.requestContext.domainName}`;;

    const apigwManagementApi = new ApiGatewayManagementApi({
        apiVersion: '2018-11-29',
        endpoint: endpoint
    });
    
    if (routeKey === '$connect') {
        console.log(`Connection established: ${connectionId}`);
    } else if (routeKey === '$disconnect') {
        console.log(`Connection closed: ${connectionId}`);
    } else if (routeKey === '$default') {
        console.log(`Message received: ${event.body}`);
        try {
            await apigwManagementApi.postToConnection({
                ConnectionId: connectionId,
                Data: JSON.stringify({ 
                    message: 'Hello from the server',
                    requestBody: JSON.parse(event.body as string)
                })
            }).promise();
        }catch (e) {
            console.error('Failed to send message:', e);
            return { statusCode: 500, body: 'Failed to send message' };
        }
    } else {
        return { statusCode: 400, body: 'Invalid route key' };
    }
    return { statusCode: 200, body: 'Success' };
}