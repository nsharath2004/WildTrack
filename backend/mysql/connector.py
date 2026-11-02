import pymysql
import pymysql.cursors

def connect(*args, **kwargs):
    host = kwargs.get('host', 'localhost')
    user = kwargs.get('user', 'root')
    password = kwargs.get('password', '')
    database = kwargs.get('database', 'wildlife_management')
    port = int(kwargs.get('port', 3306))

    conn = pymysql.connect(
        host=host,
        user=user,
        password=password,
        database=database,
        port=port,
        cursorclass=pymysql.cursors.DictCursor,
        autocommit=False
    )
    orig_cursor = conn.cursor
    def cursor(dictionary=True, **c_kwargs):
        return orig_cursor(pymysql.cursors.DictCursor)
    conn.cursor = cursor
    return conn

class Error(Exception):
    pass
