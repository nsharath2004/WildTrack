
import decimal
import datetime
from config import Config


def get_db_connection():
    """Establish and return an active MySQL database connection."""
    try:
        import mysql.connector
        return mysql.connector.connect(
            host=Config.MYSQL_HOST,
            user=Config.MYSQL_USER,
            password=Config.MYSQL_PASSWORD,
            database=Config.MYSQL_DATABASE,
            port=Config.MYSQL_PORT
        )
    except Exception:
        import pymysql
        import pymysql.cursors

        conn = pymysql.connect(
            host=Config.MYSQL_HOST,
            user=Config.MYSQL_USER,
            password=Config.MYSQL_PASSWORD,
            database=Config.MYSQL_DATABASE,
            port=Config.MYSQL_PORT,
            cursorclass=pymysql.cursors.DictCursor,
            autocommit=False
        )

        orig_cursor = conn.cursor

        def cursor_compat(dictionary=True, **kwargs):
            return orig_cursor(pymysql.cursors.DictCursor)

        conn.cursor = cursor_compat
        return conn



def serialize_row(row):
    """Recursively convert MySQL values into JSON-compatible values."""

    if row is None:
        return None

    # Handle dictionaries
    if isinstance(row, dict):
        return {
            key: serialize_row(value)
            for key, value in row.items()
        }

    # Handle lists and tuples
    if isinstance(row, (list, tuple)):
        return [serialize_row(item) for item in row]

    # Handle decimal values
    if isinstance(row, decimal.Decimal):
        return float(row)

    # FIX: Handle MySQL TIME values returned as timedelta
    if isinstance(row, datetime.timedelta):
        return str(row)

    # Handle date, datetime and time
    if isinstance(row, (datetime.datetime, datetime.date, datetime.time)):
        return row.isoformat()

    # Handle binary values
    if isinstance(row, bytes):
        return row.decode('utf-8', errors='ignore')

    return row
