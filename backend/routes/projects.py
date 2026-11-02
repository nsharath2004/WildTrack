from flask import Blueprint, jsonify, request
from services.db_service import get_db_connection, serialize_row
from middleware.auth import token_required, roles_required

projects_bp = Blueprint('projects', __name__)

@projects_bp.route('/api/projects', methods=['GET'])
@token_required
def get_all_projects():
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM Projects ORDER BY start_date DESC")
        rows = cursor.fetchall()
        return jsonify([serialize_row(r) for r in rows]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

@projects_bp.route('/api/projects/<int:project_id>', methods=['GET'])
@token_required
def get_project(project_id):
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM Projects WHERE project_id = %s", (project_id,))
        row = cursor.fetchone()
        if not row:
            return jsonify({'error': 'Project not found'}), 404
        return jsonify(serialize_row(row)), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

@projects_bp.route('/api/projects', methods=['POST'])
@roles_required('Admin')
def create_project():
    data = request.json or {}
    if not data.get('project_name') or not data.get('start_date'):
        return jsonify({'error': 'Project name and start date are required'}), 400

    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            INSERT INTO Projects (project_name, description, budget, start_date, end_date, status, project_lead)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (
            data.get('project_name'),
            data.get('description', ''),
            float(data.get('budget', 0) or 0),
            data.get('start_date'),
            data.get('end_date') or None,
            data.get('status', 'Planning'),
            data.get('project_lead', '')
        ))
        conn.commit()
        new_id = cursor.lastrowid
        cursor.execute("SELECT * FROM Projects WHERE project_id = %s", (new_id,))
        return jsonify(serialize_row(cursor.fetchone())), 201
    except Exception as e:
        if conn: conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

@projects_bp.route('/api/projects/<int:project_id>', methods=['PUT'])
@roles_required('Admin')
def update_project(project_id):
    data = request.json or {}
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT project_id FROM Projects WHERE project_id = %s", (project_id,))
        if not cursor.fetchone():
            return jsonify({'error': 'Project not found'}), 404

        cursor.execute("""
            UPDATE Projects SET
                project_name = %s, description = %s, budget = %s,
                start_date = %s, end_date = %s, status = %s, project_lead = %s
            WHERE project_id = %s
        """, (
            data.get('project_name'),
            data.get('description', ''),
            float(data.get('budget', 0) or 0),
            data.get('start_date'),
            data.get('end_date') or None,
            data.get('status', 'Planning'),
            data.get('project_lead', ''),
            project_id
        ))
        conn.commit()
        cursor.execute("SELECT * FROM Projects WHERE project_id = %s", (project_id,))
        return jsonify(serialize_row(cursor.fetchone())), 200
    except Exception as e:
        if conn: conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

@projects_bp.route('/api/projects/<int:project_id>', methods=['DELETE'])
@roles_required('Admin')
def delete_project(project_id):
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT project_id FROM Projects WHERE project_id = %s", (project_id,))
        if not cursor.fetchone():
            return jsonify({'error': 'Project not found'}), 404
        cursor.execute("DELETE FROM Projects WHERE project_id = %s", (project_id,))
        conn.commit()
        return jsonify({'message': 'Project deleted successfully'}), 200
    except Exception as e:
        if conn: conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()
