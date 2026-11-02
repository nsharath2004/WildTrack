from flask import Blueprint, jsonify, request
from services.db_service import get_db_connection, serialize_row
from middleware.auth import token_required, roles_required

sightings_bp = Blueprint('sightings', __name__)

@sightings_bp.route('/api/sightings', methods=['GET'])
@token_required
def get_all_sightings():
    conn = None
    cursor = None
    try:
        limit = request.args.get('limit')
        area_id = request.args.get('area_id')
        animal_id = request.args.get('animal_id')

        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        sql = """
            SELECT si.*, a.animal_name, a.tag_number, s.common_name AS species_name,
                   pa.area_name
            FROM Sightings si
            LEFT JOIN Animals a ON si.animal_id = a.animal_id
            LEFT JOIN Species s ON a.species_id = s.species_id
            LEFT JOIN Protected_Area pa ON si.area_id = pa.area_id
            WHERE 1=1
        """
        params = []
        if area_id:
            sql += " AND si.area_id = %s"
            params.append(int(area_id))
        if animal_id:
            sql += " AND si.animal_id = %s"
            params.append(int(animal_id))

        sql += " ORDER BY si.sighting_date DESC, si.sighting_time DESC"
        if limit:
            sql += f" LIMIT {int(limit)}"

        cursor.execute(sql, tuple(params))
        rows = cursor.fetchall()
        return jsonify([serialize_row(r) for r in rows]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

@sightings_bp.route('/api/sightings/recent', methods=['GET'])
@token_required
def get_recent_sightings():
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT si.*, a.animal_name, a.tag_number, s.common_name AS species_name,
                   pa.area_name
            FROM Sightings si
            LEFT JOIN Animals a ON si.animal_id = a.animal_id
            LEFT JOIN Species s ON a.species_id = s.species_id
            LEFT JOIN Protected_Area pa ON si.area_id = pa.area_id
            ORDER BY si.sighting_date DESC, si.sighting_time DESC
            LIMIT 10
        """)
        rows = cursor.fetchall()
        return jsonify([serialize_row(r) for r in rows]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

@sightings_bp.route('/api/sightings/<int:sighting_id>', methods=['GET'])
@token_required
def get_sighting(sighting_id):
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT si.*, a.animal_name, a.tag_number, s.common_name AS species_name,
                   pa.area_name
            FROM Sightings si
            LEFT JOIN Animals a ON si.animal_id = a.animal_id
            LEFT JOIN Species s ON a.species_id = s.species_id
            LEFT JOIN Protected_Area pa ON si.area_id = pa.area_id
            WHERE si.sighting_id = %s
        """, (sighting_id,))
        row = cursor.fetchone()
        if not row:
            return jsonify({'error': 'Sighting record not found'}), 404
        return jsonify(serialize_row(row)), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

@sightings_bp.route('/api/sightings', methods=['POST'])
@roles_required('Admin', 'Researcher', 'Forest Officer')
def create_sighting():
    data = request.json or {}
    if not data.get('animal_id') or not data.get('area_id') or not data.get('sighting_date'):
        return jsonify({'error': 'Animal, protected area, and date are required'}), 400

    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            INSERT INTO Sightings (animal_id, area_id, sighting_date, sighting_time, location_description, observed_by, notes)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (
            int(data.get('animal_id')),
            int(data.get('area_id')),
            data.get('sighting_date'),
            data.get('sighting_time') or '08:00:00',
            data.get('location_description', ''),
            data.get('observed_by', 'Ranger Unit'),
            data.get('notes', '')
        ))
        conn.commit()
        new_id = cursor.lastrowid
        cursor.execute("""
            SELECT si.*, a.animal_name, s.common_name AS species_name, pa.area_name
            FROM Sightings si
            LEFT JOIN Animals a ON si.animal_id = a.animal_id
            LEFT JOIN Species s ON a.species_id = s.species_id
            LEFT JOIN Protected_Area pa ON si.area_id = pa.area_id
            WHERE si.sighting_id = %s
        """, (new_id,))
        return jsonify(serialize_row(cursor.fetchone())), 201
    except Exception as e:
        if conn: conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

@sightings_bp.route('/api/sightings/<int:sighting_id>', methods=['PUT'])
@roles_required('Admin', 'Researcher', 'Forest Officer')
def update_sighting(sighting_id):
    data = request.json or {}
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT sighting_id FROM Sightings WHERE sighting_id = %s", (sighting_id,))
        if not cursor.fetchone():
            return jsonify({'error': 'Sighting not found'}), 404

        cursor.execute("""
            UPDATE Sightings SET
                animal_id = %s, area_id = %s, sighting_date = %s,
                sighting_time = %s, location_description = %s,
                observed_by = %s, notes = %s
            WHERE sighting_id = %s
        """, (
            int(data.get('animal_id')),
            int(data.get('area_id')),
            data.get('sighting_date'),
            data.get('sighting_time') or '08:00:00',
            data.get('location_description', ''),
            data.get('observed_by', ''),
            data.get('notes', ''),
            sighting_id
        ))
        conn.commit()
        cursor.execute("""
            SELECT si.*, a.animal_name, s.common_name AS species_name, pa.area_name
            FROM Sightings si
            LEFT JOIN Animals a ON si.animal_id = a.animal_id
            LEFT JOIN Species s ON a.species_id = s.species_id
            LEFT JOIN Protected_Area pa ON si.area_id = pa.area_id
            WHERE si.sighting_id = %s
        """, (sighting_id,))
        return jsonify(serialize_row(cursor.fetchone())), 200
    except Exception as e:
        if conn: conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

@sightings_bp.route('/api/sightings/<int:sighting_id>', methods=['DELETE'])
@roles_required('Admin', 'Forest Officer')
def delete_sighting(sighting_id):
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT sighting_id FROM Sightings WHERE sighting_id = %s", (sighting_id,))
        if not cursor.fetchone():
            return jsonify({'error': 'Sighting not found'}), 404
        cursor.execute("DELETE FROM Sightings WHERE sighting_id = %s", (sighting_id,))
        conn.commit()
        return jsonify({'message': 'Sighting deleted successfully'}), 200
    except Exception as e:
        if conn: conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()
