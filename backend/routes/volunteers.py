from flask import Blueprint, jsonify, request
from services.db_service import get_db_connection, serialize_row
from middleware.auth import token_required, roles_required

volunteers_bp = Blueprint('volunteers', __name__)

@volunteers_bp.route('/api/volunteers', methods=['GET'])
@token_required
def get_all_volunteers():
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT v.*, pa.area_name
            FROM Volunteers v
            LEFT JOIN Protected_Area pa ON v.area_id = pa.area_id
            ORDER BY v.first_name ASC, v.last_name ASC
        """)
        rows = cursor.fetchall()
        return jsonify([serialize_row(r) for r in rows]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

@volunteers_bp.route('/api/volunteers/<int:volunteer_id>', methods=['GET'])
@token_required
def get_volunteer(volunteer_id):
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT v.*, pa.area_name
            FROM Volunteers v
            LEFT JOIN Protected_Area pa ON v.area_id = pa.area_id
            WHERE v.volunteer_id = %s
        """, (volunteer_id,))
        row = cursor.fetchone()
        if not row:
            return jsonify({'error': 'Volunteer not found'}), 404
        return jsonify(serialize_row(row)), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

@volunteers_bp.route('/api/volunteers', methods=['POST'])
@roles_required('Admin', 'Forest Officer')
def create_volunteer():
    data = request.json or {}
    if not data.get('first_name') or not data.get('last_name') or not data.get('email') or not data.get('join_date'):
        return jsonify({'error': 'First name, last name, email, and join date are required'}), 400

    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            INSERT INTO Volunteers (first_name, last_name, email, phone, area_id, join_date, skills, status)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            data.get('first_name'),
            data.get('last_name'),
            data.get('email'),
            data.get('phone', ''),
            int(data.get('area_id')) if data.get('area_id') else None,
            data.get('join_date'),
            data.get('skills', ''),
            data.get('status', 'Active')
        ))
        conn.commit()
        new_id = cursor.lastrowid
        cursor.execute("""
            SELECT v.*, pa.area_name
            FROM Volunteers v
            LEFT JOIN Protected_Area pa ON v.area_id = pa.area_id
            WHERE v.volunteer_id = %s
        """, (new_id,))
        return jsonify(serialize_row(cursor.fetchone())), 201
    except Exception as e:
        if conn: conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

@volunteers_bp.route('/api/volunteers/<int:volunteer_id>', methods=['PUT'])
@roles_required('Admin', 'Forest Officer')
def update_volunteer(volunteer_id):
    data = request.json or {}
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT volunteer_id FROM Volunteers WHERE volunteer_id = %s", (volunteer_id,))
        if not cursor.fetchone():
            return jsonify({'error': 'Volunteer not found'}), 404

        cursor.execute("""
            UPDATE Volunteers SET
                first_name = %s, last_name = %s, email = %s, phone = %s,
                area_id = %s, join_date = %s, skills = %s, status = %s
            WHERE volunteer_id = %s
        """, (
            data.get('first_name'),
            data.get('last_name'),
            data.get('email'),
            data.get('phone', ''),
            int(data.get('area_id')) if data.get('area_id') else None,
            data.get('join_date'),
            data.get('skills', ''),
            data.get('status', 'Active'),
            volunteer_id
        ))
        conn.commit()
        cursor.execute("""
            SELECT v.*, pa.area_name
            FROM Volunteers v
            LEFT JOIN Protected_Area pa ON v.area_id = pa.area_id
            WHERE v.volunteer_id = %s
        """, (volunteer_id,))
        return jsonify(serialize_row(cursor.fetchone())), 200
    except Exception as e:
        if conn: conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

@volunteers_bp.route('/api/volunteers/<int:volunteer_id>', methods=['DELETE'])
@roles_required('Admin')
def delete_volunteer(volunteer_id):
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT volunteer_id FROM Volunteers WHERE volunteer_id = %s", (volunteer_id,))
        if not cursor.fetchone():
            return jsonify({'error': 'Volunteer not found'}), 404
        cursor.execute("DELETE FROM Volunteers WHERE volunteer_id = %s", (volunteer_id,))
        conn.commit()
        return jsonify({'message': 'Volunteer deleted successfully'}), 200
    except Exception as e:
        if conn: conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()
