from flask import Blueprint, jsonify, request
from services.db_service import get_db_connection, serialize_row
from middleware.auth import token_required, roles_required

threats_bp = Blueprint('threats', __name__)

@threats_bp.route('/api/threats', methods=['GET'])
@token_required
def get_all_threats():
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM Threats ORDER BY threat_date DESC, threat_id DESC")
        rows = cursor.fetchall()
        return jsonify([serialize_row(r) for r in rows]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

@threats_bp.route('/api/threats/recent', methods=['GET'])
@token_required
def get_recent_threats():
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT * FROM Threats
            WHERE status = 'Active'
            ORDER BY threat_date DESC
            LIMIT 5
        """)
        rows = cursor.fetchall()
        return jsonify([serialize_row(r) for r in rows]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

@threats_bp.route('/api/threats/<int:threat_id>', methods=['GET'])
@token_required
def get_threat(threat_id):
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM Threats WHERE threat_id = %s", (threat_id,))
        row = cursor.fetchone()
        if not row:
            return jsonify({'error': 'Threat not found'}), 404
        return jsonify(serialize_row(row)), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

@threats_bp.route('/api/threats', methods=['POST'])
@roles_required('Admin', 'Forest Officer')
def create_threat():
    data = request.json or {}
    if not data.get('threat_type') or not data.get('location') or not data.get('threat_date'):
        return jsonify({'error': 'Threat type, location, and date are required'}), 400

    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            INSERT INTO Threats (threat_type, severity, location, threat_date, description, reported_by, status)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (
            data.get('threat_type', 'Poaching'),
            data.get('severity', 'Medium'),
            data.get('location'),
            data.get('threat_date'),
            data.get('description', ''),
            data.get('reported_by', 'Forest Ranger'),
            data.get('status', 'Active')
        ))
        conn.commit()
        new_id = cursor.lastrowid
        # Trigger after_threat_insert executes automatically if severity == 'Critical'
        cursor.execute("SELECT * FROM Threats WHERE threat_id = %s", (new_id,))
        return jsonify(serialize_row(cursor.fetchone())), 201
    except Exception as e:
        if conn: conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

@threats_bp.route('/api/threats/<int:threat_id>', methods=['PUT'])
@roles_required('Admin', 'Forest Officer')
def update_threat(threat_id):
    data = request.json or {}
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT threat_id FROM Threats WHERE threat_id = %s", (threat_id,))
        if not cursor.fetchone():
            return jsonify({'error': 'Threat not found'}), 404

        cursor.execute("""
            UPDATE Threats SET
                threat_type = %s, severity = %s, location = %s,
                threat_date = %s, description = %s, reported_by = %s, status = %s
            WHERE threat_id = %s
        """, (
            data.get('threat_type'),
            data.get('severity'),
            data.get('location'),
            data.get('threat_date'),
            data.get('description', ''),
            data.get('reported_by', ''),
            data.get('status', 'Active'),
            threat_id
        ))
        conn.commit()
        cursor.execute("SELECT * FROM Threats WHERE threat_id = %s", (threat_id,))
        return jsonify(serialize_row(cursor.fetchone())), 200
    except Exception as e:
        if conn: conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

@threats_bp.route('/api/threats/<int:threat_id>', methods=['DELETE'])
@roles_required('Admin')
def delete_threat(threat_id):
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT threat_id FROM Threats WHERE threat_id = %s", (threat_id,))
        if not cursor.fetchone():
            return jsonify({'error': 'Threat not found'}), 404
        cursor.execute("DELETE FROM Threats WHERE threat_id = %s", (threat_id,))
        conn.commit()
        return jsonify({'message': 'Threat deleted successfully'}), 200
    except Exception as e:
        if conn: conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()
