import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { PutCommand, DynamoDBDocumentClient, DeleteCommand, GetCommandOutput, GetCommand, QueryCommand, QueryCommandOutput } from "@aws-sdk/lib-dynamodb";

type SuccessfulResponseType = {
    result: boolean;
}

interface DynamoDBManageInterface {
    putItem(connectionId: string, locationId: string): Promise<SuccessfulResponseType>;
    deleteItem(connectionId: string, locationId: string): Promise<SuccessfulResponseType>;
}

export default class DynamoDBManage implements DynamoDBManageInterface {
    private client: DynamoDBDocumentClient;

    constructor(private tableName: string) {
        const _client = new DynamoDBClient();
        this.client = DynamoDBDocumentClient.from(_client);
    }

    async putItem(connectionId: string, locationId: string): Promise<SuccessfulResponseType> {
        const params = {
            TableName: this.tableName,
            Item: { connectionId, locationId }
        };
        try {
            const response = await this.client.send(new PutCommand(params));
            if (response.$metadata.httpStatusCode !== 200) {
                throw new Error(`Failed to put item. Status: ${response.$metadata.httpStatusCode}`);
            }
            return { result: true };
        } catch (error) {
            console.error('Error putting item:', error);
            throw new Error(`Failed to put item: ${error.message}`);
        }
    }

   
    async deleteItem(connectionId: string, locationId: string): Promise<SuccessfulResponseType> {
        const params = {
            TableName: this.tableName,
            Key: { connectionId, locationId }
        };
        try {
            const response = await this.client.send(new DeleteCommand(params));
            if (response.$metadata.httpStatusCode !== 200) {
                throw new Error(`Failed to delete item. Status: ${response.$metadata.httpStatusCode}`);
            }
            return { result: true };
        } catch (error) {
            console.error('Error deleting item:', error);
            throw new Error(`Failed to delete item: ${error.message}`);
        }
    }
}