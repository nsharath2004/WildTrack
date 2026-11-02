from flask import Blueprint, jsonify, request
from services.db_service import get_db_connection, serialize_row
from middleware.auth import token_required, roles_required

areas_bp = Blueprint('protected_areas', __name__)

@areas_bp.route('/api/areas', methods=['GET'])
@token_required
def get_all_areas():
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT pa.*, COUNT(a.animal_id) AS animal_count
            FROM Protected_Area pa
            LEFT JOIN Animals a ON pa.area_id = a.area_id
            GROUP BY pa.area_id, pa.area_name, pa.location, pa.area_size_km2, pa.area_type, pa.description, pa.established_year, pa.created_at
            ORDER BY pa.area_name ASC
        """)
        rows = cursor.fetchall()
        return jsonify([serialize_row(r) for r in rows]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

@areas_bp.route('/api/areas/<int:area_id>', methods=['GET'])
@token_required
def get_area(area_id):
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM Protected_Area WHERE area_id = %s", (area_id,))
        row = cursor.fetchone()
        if not row:
            return jsonify({'error': 'Protected area not found'}), 404
        return jsonify(serialize_row(row)), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

@areas_bp.route('/api/areas', methods=['POST'])
@roles_required('Admin')
def create_area():
    conn = None
    cursor = None
    try:
        data = request.json or {}
        if not data.get('area_name') or not data.get('location'):
            return jsonify({'error': 'Area name and location are required'}), 400

        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            INSERT INTO Protected_Area (area_name, location, area_size_km2, area_type, description, established_year)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (
            data.get('area_name'),
            data.get('location'),
            float(data.get('area_size_km2', 0)),
            data.get('area_type', 'National Park'),
            data.get('description', ''),
            int(data.get('established_year', 2000))
        ))
        conn.commit()
        new_id = cursor.lastrowid
        cursor.execute("SELECT * FROM Protected_Area WHERE area_id = %s", (new_id,))
        return jsonify(serialize_row(cursor.fetchone())), 201
    except Exception as e:
        if conn: conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

@areas_bp.route('/api/areas/<int:area_id>', methods=['PUT'])
@roles_required('Admin', 'Forest Officer')
def update_area(area_id):
    conn = None
    cursor = None
    try:
        data = request.json or {}
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT area_id FROM Protected_Area WHERE area_id = %s", (area_id,))
        if not cursor.fetchone():
            return jsonify({'error': 'Protected area not found'}), 404

        cursor.execute("""
            UPDATE Protected_Area SET
                area_name = %s, location = %s, area_size_km2 = %s,
                area_type = %s, description = %s, established_year = %s
            WHERE area_id = %s
        """, (
            data.get('area_name'),
            data.get('location'),
            float(data.get('area_size_km2', 0)),
            data.get('area_type', 'National Park'),
            data.get('description', ''),
            int(data.get('established_year', 2000)),
            area_id
        ))
        conn.commit()
        cursor.execute("SELECT * FROM Protected_Area WHERE area_id = %s", (area_id,))
        return jsonify(serialize_row(cursor.fetchone())), 200
    except Exception as e:
        if conn: conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

@areas_bp.route('/api/areas/<int:area_id>', methods=['DELETE'])
@roles_required('Admin')
def delete_area(area_id):
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT area_id FROM Protected_Area WHERE area_id = %s", (area_id,))
        if not cursor.fetchone():
            return jsonify({'error': 'Protected area not found'}), 404
        cursor.execute("DELETE FROM Protected_Area WHERE area_id = %s", (area_id,))
        conn.commit()
        return jsonify({'message': 'Protected area deleted successfully'}), 200
    except Exception as e:
        if conn: conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()
