import logging
from constants import HttpStatus
from models import Connection

logger = logging.getLogger()


def connect(connection: Connection):
    logger.info('connect')
    try:
        connection.put_item({
            'connection_id': connection.connection_id,
            'location_id': connection.location_id
        })
        return HttpStatus.OK
    except Exception as e:
        logger.error(f"Error in connect handler: {e}")
        return HttpStatus.INTERNAL_SERVER_ERROR


def disconnect() -> int:
    pass


def default() -> int:
    logger.info('Default handler')
    return HttpStatus.OK
