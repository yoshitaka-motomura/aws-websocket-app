import { APIGatewayProxyEvent } from 'aws-lambda';
import { ApiGatewayManagementApi } from 'aws-sdk';

const TABLE_NAME = process.env.TABLE_NAME as string
export async function handler(event: APIGatewayProxyEvent) {
    const routeKey = event.requestContext.routeKey;
    const connectionId = event.requestContext.connectionId as string;
    const locationId = event.queryStringParameters?.location_id;

    const endpoint = `https://${event.requestContext.domainName}`;;

    const apigwManagementApi = new ApiGatewayManagementApi({
        apiVersion: '2018-11-29',
        endpoint: endpoint
    });
    
    if (routeKey === '$connect') {
        if (!locationId) {
            return { statusCode: 400, body: 'location_id is required' };
        }
        try {
            //await PutItem(TABLE_NAME, connectionId, locationId);
        }catch (e) {
            console.error('Failed to put item:', e);
            return { statusCode: 500, body: 'Failed to put item' };
        }
    } else if (routeKey === '$disconnect') {
        
    } else if (routeKey === '$default') {
        // message received
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