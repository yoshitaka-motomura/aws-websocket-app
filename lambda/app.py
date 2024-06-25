import os
import logging
import boto3
from models import Connection
import handlers
from constants import HttpStatus

logger = logging.getLogger()
logger.setLevel(logging.INFO)

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['TABLE_NAME'])


def lambda_handler(event):
    route_key = event.get('requestContext', {}).get('routeKey')
    connection_id = event.get('requestContext', {}).get('connectionId')
    location_id = event.get('queryStringParameters', {}).get('location_id')

    response = {'statusCode': HttpStatus.OK}

    if not connection_id or not location_id or not route_key:
        response['statusCode'] = HttpStatus.BAD_REQUEST
        return response

    try:
        if route_key == 'connect':
            response['statusCode'] = handlers.connect(
                connection=Connection(
                    connection_id=connection_id,
                    location_id=location_id,
                    table=table
                )
            )
        elif route_key == 'disconnect':
            """
           disconnect route
           """
        else:
            response['statusCode'] = handlers.default()
    except Exception as e:
        logger.error(e)
        response['statusCode'] = HttpStatus.INTERNAL_SERVER_ERROR

    return response
