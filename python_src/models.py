from pydantic import BaseModel
from typing import Optional
from boto3.dynamodb import table
from botocore.exceptions import ClientError
import logging

logger = logging.getLogger()

class Connection(BaseModel):
    connection_id: Optional[str]
    location_id: Optional[str]
    table: table

    def put_item(self, item: dict) -> bool:
        try:
            self.table.put_item(Item=item)
            return True
        except ClientError as e:
            logger.error(e)
            raise e

    def delete_item(self, key: dict):
        return self.table.delete_item(Key=key)
