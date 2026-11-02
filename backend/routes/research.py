from flask import Blueprint, jsonify, request
from services.db_service import get_db_connection, serialize_row
from middleware.auth import token_required, roles_required

research_bp = Blueprint('research', __name__)

def normalize_status(status):
    if not status: return 'Planned'
    s = str(status).strip()
    if s.lower() == 'ongoing': return 'Active'
    valid = ['Planned', 'Active', 'Completed', 'Suspended']
    for v in valid:
        if v.lower() == s.lower(): return v
    return 'Planned'

@research_bp.route('/api/research', methods=['GET'])
@token_required
def get_all_research():
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT r.*, CONCAT(res.first_name, ' ', res.last_name) AS researcher_name,
                   res.specialization, res.institution
            FROM Research r
            LEFT JOIN Researchers res ON r.researcher_id = res.researcher_id
            ORDER BY r.start_date DESC
        """)
        rows = cursor.fetchall()
        return jsonify([serialize_row(r) for r in rows]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

@research_bp.route('/api/research/<int:research_id>', methods=['GET'])
@token_required
def get_research(research_id):
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT r.*, CONCAT(res.first_name, ' ', res.last_name) AS researcher_name,
                   res.specialization, res.institution
            FROM Research r
            LEFT JOIN Researchers res ON r.researcher_id = res.researcher_id
            WHERE r.research_id = %s
        """, (research_id,))
        row = cursor.fetchone()
        if not row:
            return jsonify({'error': 'Research project not found'}), 404
        return jsonify(serialize_row(row)), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

@research_bp.route('/api/research', methods=['POST'])
@roles_required('Admin', 'Researcher')
def create_research():
    data = request.json or {}
    if not data.get('title') or not data.get('researcher_id') or not data.get('start_date'):
        return jsonify({'error': 'Title, researcher, and start date are required'}), 400

    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            INSERT INTO Research (title, description, researcher_id, start_date, end_date, status)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (
            data.get('title'),
            data.get('description', ''),
            int(data.get('researcher_id')),
            data.get('start_date'),
            data.get('end_date') or None,
            normalize_status(data.get('status'))
        ))
        conn.commit()
        new_id = cursor.lastrowid
        cursor.execute("""
            SELECT r.*, CONCAT(res.first_name, ' ', res.last_name) AS researcher_name
            FROM Research r
            LEFT JOIN Researchers res ON r.researcher_id = res.researcher_id
            WHERE r.research_id = %s
        """, (new_id,))
        return jsonify(serialize_row(cursor.fetchone())), 201
    except Exception as e:
        if conn: conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

@research_bp.route('/api/research/<int:research_id>', methods=['PUT'])
@roles_required('Admin', 'Researcher')
def update_research(research_id):
    data = request.json or {}
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT research_id FROM Research WHERE research_id = %s", (research_id,))
        if not cursor.fetchone():
            return jsonify({'error': 'Research project not found'}), 404

        cursor.execute("""
            UPDATE Research SET
                title = %s, description = %s, researcher_id = %s,
                start_date = %s, end_date = %s, status = %s
            WHERE research_id = %s
        """, (
            data.get('title'),
            data.get('description', ''),
            int(data.get('researcher_id')),
            data.get('start_date'),
            data.get('end_date') or None,
            normalize_status(data.get('status')),
            research_id
        ))
        conn.commit()
        cursor.execute("""
            SELECT r.*, CONCAT(res.first_name, ' ', res.last_name) AS researcher_name
            FROM Research r
            LEFT JOIN Researchers res ON r.researcher_id = res.researcher_id
            WHERE r.research_id = %s
        """, (research_id,))
        return jsonify(serialize_row(cursor.fetchone())), 200
    except Exception as e:
        if conn: conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

@research_bp.route('/api/research/<int:research_id>', methods=['DELETE'])
@roles_required('Admin')
def delete_research(research_id):
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT research_id FROM Research WHERE research_id = %s", (research_id,))
        if not cursor.fetchone():
            return jsonify({'error': 'Research project not found'}), 404
        cursor.execute("DELETE FROM Research WHERE research_id = %s", (research_id,))
        conn.commit()
        return jsonify({'message': 'Research project deleted successfully'}), 200
    except Exception as e:
        if conn: conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()
