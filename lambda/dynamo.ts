import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import {
  PutCommand,
  DynamoDBDocumentClient,
  DeleteCommand,
  QueryCommand,
  QueryCommandOutput,
} from '@aws-sdk/lib-dynamodb'

interface DynamoDBManageInterface {
  putItem(connectionId: string, locationId: string): Promise<boolean>
  deleteItem(connectionId: string): Promise<boolean>
  queryByLocationId(locationId: string): Promise<Pick<QueryCommandOutput, 'Items'>>
}

export default class DynamoDBManage implements DynamoDBManageInterface {
  private client: DynamoDBDocumentClient
  private TTL_HOUR = 3
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
      const now = new Date()
      const params = {
        TableName: this.tableName,
        Item: {
          connectionId,
          locationId,
          ttl: Math.floor(now.getTime() / 1000) + this.TTL_HOUR * 60 * 60,
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
  /**
   * deleteItem
   * @param connectionId
   * @returns boolean
   */
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
  /**
   * queryByLocationId
   * @param locationId
   * @returns Pick<QueryCommandOutput, 'Items'>
   */
  async queryByLocationId(locationId: string): Promise<Pick<QueryCommandOutput, 'Items'>> {
    try {
      const params = {
        TableName: this.tableName,
        IndexName: 'LocationIndex',
        KeyConditionExpression: 'locationId = :locationId',
        ExpressionAttributeValues: {
          ':locationId': locationId,
        },
      }
      const result = await this.client.send(new QueryCommand(params))
      return result.Items as Pick<QueryCommandOutput, 'Items'>
    } catch (err) {
      console.error('Failed:', err)
      return [] as Pick<QueryCommandOutput, 'Items'>
    }
  }
}
