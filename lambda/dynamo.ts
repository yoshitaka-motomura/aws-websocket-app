import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import {
  PutCommand,
  DynamoDBDocumentClient,
  DeleteCommand,
  GetCommandOutput,
  GetCommand,
  QueryCommand,
  QueryCommandOutput,
} from '@aws-sdk/lib-dynamodb'

interface DynamoDBManageInterface {
  putItem(connectionId: string, locationId: string): Promise<boolean>
  deleteItem(connectionId: string): Promise<boolean>
}

export default class DynamoDBManage implements DynamoDBManageInterface {
  private client: DynamoDBDocumentClient
  constructor(private tableName: string) {
    this.client = DynamoDBDocumentClient.from(new DynamoDBClient())
  }
  /**
   * putItem
   * @param connectionId
   * @param locationId
   * @returns boolean
   */
  async putItem(connectionId: string, locationId: string): Promise<boolean> {
    try {
      const params = {
        TableName: this.tableName,
        Item: {
          connectionId,
          locationId,
        },
      }
      const result = await this.client.send(new PutCommand(params))
      if (result.$metadata.httpStatusCode === 200) return true
      throw new Error('Failed to put item')
    } catch (err) {
      console.error('Failed:', err)
      return false
    }
  }

  async deleteItem(connectionId: string): Promise<boolean> {
    try {
      const params = {
        TableName: this.tableName,
        Key: {
          connectionId,
        },
      }
      const result = await this.client.send(new DeleteCommand(params))
      if (result.$metadata.httpStatusCode === 200) return true
      throw new Error('Failed to delete item')
    } catch (err) {
      console.error('Failed:', err)
      return false
    }
  }
}
