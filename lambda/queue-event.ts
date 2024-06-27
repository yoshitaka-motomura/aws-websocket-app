import { SQSEvent, SQSHandler } from 'aws-lambda'
import DynamoDBManage from './dynamo'
import { ApiGatewayManagementApi } from 'aws-sdk'

const TABLE_NAME = process.env.TABLE_NAME as string
const WEBSOCKET_URL = process.env.WEBSOCKET_URL as string
const dynamo = new DynamoDBManage(TABLE_NAME)

/**
 * SQS Handler
 * @param event SQSEvent
 */
export const handler: SQSHandler = async (event: SQSEvent): Promise<void> => {
  const records = event.Records
  for (const record of records) {
    const item = JSON.parse(record.body) as { message: string; locationId: string }
    const { message, locationId } = item

    for (const item of (await dynamo.queryByLocationId(locationId)) as []) {
      await sendToConnection(item as Record<'connectionId' | 'locationId', string>, `${message} from SQS`)
    }
  }
}

const sendToConnection = async (item: Record<'connectionId' | 'locationId', string>, message: string) => {
  const endpoint = WEBSOCKET_URL
  const apigwManagementApi = new ApiGatewayManagementApi({
    apiVersion: '2018-11-29',
    endpoint: endpoint,
  })

  try {
    await apigwManagementApi
      .postToConnection({
        ConnectionId: item.connectionId,
        Data: JSON.stringify({
          message,
        }),
      })
      .promise()
  } catch (e) {
    console.error('Failed to send message:', e)
  }
}
