import pymysql
from pymysql.cursors import DictCursor
from config import Config

def get_db_connection():
    """
    Establishes and returns a direct connection to MySQL 8.0+ via PyMySQL.
    Raises an explicit ConnectionError if MySQL is unreachable.
    """
    try:
        return pymysql.connect(
            host=Config.MYSQL_HOST,
            user=Config.MYSQL_USER,
            password=Config.MYSQL_PASSWORD,
            database=Config.MYSQL_DATABASE,
            port=Config.MYSQL_PORT,
            cursorclass=DictCursor,
            autocommit=False
        )
    except Exception as e:
        raise ConnectionError(f"MySQL Connection Failed: Unable to connect to MySQL on {Config.MYSQL_HOST}:{Config.MYSQL_PORT}. Error: {str(e)}")

def query_db(query, args=(), one=False):
    """Executes a parameterized SELECT query against MySQL."""
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(query, args)
            result = cursor.fetchall()
            return (result[0] if result else None) if one else result
    finally:
        conn.close()

def execute_db(query, args=(), commit=True):
    """Executes an INSERT, UPDATE, or DELETE parameterized query on MySQL."""
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(query, args)
            last_id = cursor.lastrowid
            if commit:
                conn.commit()
            return last_id
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()
