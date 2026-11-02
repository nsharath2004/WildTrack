from flask import Blueprint, jsonify, request
from services.db_service import get_db_connection, serialize_row
from middleware.auth import token_required, roles_required

researchers_bp = Blueprint('researchers', __name__)

@researchers_bp.route('/api/researchers', methods=['GET'])
@token_required
def get_all_researchers():
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT r.*, COUNT(res.research_id) AS research_count
            FROM Researchers r
            LEFT JOIN Research res ON r.researcher_id = res.researcher_id
            GROUP BY r.researcher_id, r.first_name, r.last_name, r.email, r.phone, r.specialization, r.institution, r.joining_date, r.created_at
            ORDER BY r.first_name ASC
        """)
        rows = cursor.fetchall()
        return jsonify([serialize_row(r) for r in rows]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

@researchers_bp.route('/api/researchers/<int:researcher_id>', methods=['GET'])
@token_required
def get_researcher(researcher_id):
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM Researchers WHERE researcher_id = %s", (researcher_id,))
        row = cursor.fetchone()
        if not row:
            return jsonify({'error': 'Researcher not found'}), 404
        return jsonify(serialize_row(row)), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

@researchers_bp.route('/api/researchers', methods=['POST'])
@roles_required('Admin', 'Researcher')
def create_researcher():
    data = request.json or {}
    if not data.get('first_name') or not data.get('last_name') or not data.get('email'):
        return jsonify({'error': 'First name, last name, and email are required'}), 400

    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            INSERT INTO Researchers (first_name, last_name, email, phone, specialization, institution, joining_date)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (
            data.get('first_name'),
            data.get('last_name'),
            data.get('email'),
            data.get('phone', ''),
            data.get('specialization', 'Wildlife Ecology'),
            data.get('institution', ''),
            data.get('joining_date') or '2025-01-01'
        ))
        conn.commit()
        new_id = cursor.lastrowid
        cursor.execute("SELECT * FROM Researchers WHERE researcher_id = %s", (new_id,))
        return jsonify(serialize_row(cursor.fetchone())), 201
    except Exception as e:
        if conn: conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

@researchers_bp.route('/api/researchers/<int:researcher_id>', methods=['PUT'])
@roles_required('Admin', 'Researcher')
def update_researcher(researcher_id):
    data = request.json or {}
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT researcher_id FROM Researchers WHERE researcher_id = %s", (researcher_id,))
        if not cursor.fetchone():
            return jsonify({'error': 'Researcher not found'}), 404

        cursor.execute("""
            UPDATE Researchers SET
                first_name = %s, last_name = %s, email = %s, phone = %s,
                specialization = %s, institution = %s, joining_date = %s
            WHERE researcher_id = %s
        """, (
            data.get('first_name'),
            data.get('last_name'),
            data.get('email'),
            data.get('phone', ''),
            data.get('specialization', ''),
            data.get('institution', ''),
            data.get('joining_date') or '2025-01-01',
            researcher_id
        ))
        conn.commit()
        cursor.execute("SELECT * FROM Researchers WHERE researcher_id = %s", (researcher_id,))
        return jsonify(serialize_row(cursor.fetchone())), 200
    except Exception as e:
        if conn: conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

@researchers_bp.route('/api/researchers/<int:researcher_id>', methods=['DELETE'])
@roles_required('Admin')
def delete_researcher(researcher_id):
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT researcher_id FROM Researchers WHERE researcher_id = %s", (researcher_id,))
        if not cursor.fetchone():
            return jsonify({'error': 'Researcher not found'}), 404
        cursor.execute("DELETE FROM Researchers WHERE researcher_id = %s", (researcher_id,))
        conn.commit()
        return jsonify({'message': 'Researcher deleted successfully'}), 200
    except Exception as e:
        if conn: conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()
