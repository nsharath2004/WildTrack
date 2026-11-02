from flask import Blueprint, jsonify, request
from services.db_service import get_db_connection, serialize_row
from middleware.auth import token_required, roles_required

incidents_bp = Blueprint('incidents', __name__)

@incidents_bp.route('/api/incidents', methods=['GET'])
@token_required
def get_all_incidents():
    conn = None
    cursor = None
    try:
        status_filter = request.args.get('status')
        severity_filter = request.args.get('severity')

        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        sql = """
            SELECT i.*, a.animal_name, a.tag_number, t.threat_type
            FROM Incidents i
            LEFT JOIN Animals a ON i.animal_id = a.animal_id
            LEFT JOIN Threats t ON i.threat_id = t.threat_id
            WHERE 1=1
        """
        params = []
        if status_filter:
            sql += " AND i.status = %s"
            params.append(status_filter)
        if severity_filter:
            sql += " AND i.severity = %s"
            params.append(severity_filter)

        sql += " ORDER BY i.incident_date DESC, i.incident_id DESC"
        cursor.execute(sql, tuple(params))
        rows = cursor.fetchall()
        return jsonify([serialize_row(r) for r in rows]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

@incidents_bp.route('/api/incidents/<int:incident_id>', methods=['GET'])
@token_required
def get_incident(incident_id):
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT i.*, a.animal_name, a.tag_number, t.threat_type
            FROM Incidents i
            LEFT JOIN Animals a ON i.animal_id = a.animal_id
            LEFT JOIN Threats t ON i.threat_id = t.threat_id
            WHERE i.incident_id = %s
        """, (incident_id,))
        row = cursor.fetchone()
        if not row:
            return jsonify({'error': 'Incident not found'}), 404
        return jsonify(serialize_row(row)), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

@incidents_bp.route('/api/incidents', methods=['POST'])
@roles_required('Admin', 'Forest Officer')
def create_incident():
    data = request.json or {}
    if not data.get('incident_title') or not data.get('location') or not data.get('incident_date'):
        return jsonify({'error': 'Incident title, location, and date are required'}), 400

    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            INSERT INTO Incidents (incident_title, animal_id, threat_id, incident_date, description, location, severity, status, resolved_date)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            data.get('incident_title'),
            int(data.get('animal_id')) if data.get('animal_id') else None,
            int(data.get('threat_id')) if data.get('threat_id') else None,
            data.get('incident_date'),
            data.get('description', ''),
            data.get('location'),
            data.get('severity', 'Medium'),
            data.get('status', 'Open'),
            data.get('resolved_date') or None
        ))
        conn.commit()
        new_id = cursor.lastrowid
        cursor.execute("""
            SELECT i.*, a.animal_name, t.threat_type
            FROM Incidents i
            LEFT JOIN Animals a ON i.animal_id = a.animal_id
            LEFT JOIN Threats t ON i.threat_id = t.threat_id
            WHERE i.incident_id = %s
        """, (new_id,))
        return jsonify(serialize_row(cursor.fetchone())), 201
    except Exception as e:
        if conn: conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

@incidents_bp.route('/api/incidents/<int:incident_id>', methods=['PUT'])
@roles_required('Admin', 'Forest Officer')
def update_incident(incident_id):
    data = request.json or {}
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT incident_id FROM Incidents WHERE incident_id = %s", (incident_id,))
        if not cursor.fetchone():
            return jsonify({'error': 'Incident not found'}), 404

        cursor.execute("""
            UPDATE Incidents SET
                incident_title = %s, animal_id = %s, threat_id = %s,
                incident_date = %s, description = %s, location = %s,
                severity = %s, status = %s, resolved_date = %s
            WHERE incident_id = %s
        """, (
            data.get('incident_title'),
            int(data.get('animal_id')) if data.get('animal_id') else None,
            int(data.get('threat_id')) if data.get('threat_id') else None,
            data.get('incident_date'),
            data.get('description', ''),
            data.get('location'),
            data.get('severity', 'Medium'),
            data.get('status', 'Open'),
            data.get('resolved_date') or None,
            incident_id
        ))
        conn.commit()
        cursor.execute("""
            SELECT i.*, a.animal_name, t.threat_type
            FROM Incidents i
            LEFT JOIN Animals a ON i.animal_id = a.animal_id
            LEFT JOIN Threats t ON i.threat_id = t.threat_id
            WHERE i.incident_id = %s
        """, (incident_id,))
        return jsonify(serialize_row(cursor.fetchone())), 200
    except Exception as e:
        if conn: conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

@incidents_bp.route('/api/incidents/<int:incident_id>', methods=['DELETE'])
@roles_required('Admin')
def delete_incident(incident_id):
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT incident_id FROM Incidents WHERE incident_id = %s", (incident_id,))
        if not cursor.fetchone():
            return jsonify({'error': 'Incident not found'}), 404
        cursor.execute("DELETE FROM Incidents WHERE incident_id = %s", (incident_id,))
        conn.commit()
        return jsonify({'message': 'Incident deleted successfully'}), 200
    except Exception as e:
        if conn: conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()
