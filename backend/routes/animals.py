from flask import Blueprint, jsonify, request
from services.db_service import get_db_connection, serialize_row
from middleware.auth import token_required, roles_required

animals_bp = Blueprint('animals', __name__)

@animals_bp.route('/api/animals', methods=['GET'])
@token_required
def get_all_animals():
    conn = None
    cursor = None
    try:
        search = request.args.get('search', '').strip()
        area_id = request.args.get('area_id')
        species_id = request.args.get('species_id')
        health = request.args.get('health')

        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        sql = """
            SELECT a.*, s.common_name AS species_name, s.scientific_name, s.conservation_status,
                   pa.area_name, pa.location AS area_location
            FROM Animals a
            LEFT JOIN Species s ON a.species_id = s.species_id
            LEFT JOIN Protected_Area pa ON a.area_id = pa.area_id
            WHERE 1=1
        """
        params = []
        if search:
            sql += " AND (a.animal_name LIKE %s OR a.tag_number LIKE %s OR s.common_name LIKE %s)"
            params.extend([f'%{search}%', f'%{search}%', f'%{search}%'])
        if area_id:
            sql += " AND a.area_id = %s"
            params.append(int(area_id))
        if species_id:
            sql += " AND a.species_id = %s"
            params.append(int(species_id))
        if health:
            sql += " AND a.health_status = %s"
            params.append(health)

        sql += " ORDER BY a.animal_id DESC"
        cursor.execute(sql, tuple(params))
        rows = cursor.fetchall()
        return jsonify([serialize_row(r) for r in rows]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

@animals_bp.route('/api/animals/<int:animal_id>', methods=['GET'])
@token_required
def get_animal(animal_id):
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT a.*, s.common_name AS species_name, s.scientific_name, s.conservation_status,
                   pa.area_name, pa.location AS area_location
            FROM Animals a
            LEFT JOIN Species s ON a.species_id = s.species_id
            LEFT JOIN Protected_Area pa ON a.area_id = pa.area_id
            WHERE a.animal_id = %s
        """, (animal_id,))
        row = cursor.fetchone()
        if not row:
            return jsonify({'error': 'Animal record not found'}), 404
        return jsonify(serialize_row(row)), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

@animals_bp.route('/api/animals/by-area/<int:area_id>', methods=['GET'])
@token_required
def get_animals_by_area(area_id):
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT a.*, s.common_name AS species_name
            FROM Animals a
            LEFT JOIN Species s ON a.species_id = s.species_id
            WHERE a.area_id = %s
            ORDER BY a.animal_name ASC
        """, (area_id,))
        rows = cursor.fetchall()
        return jsonify([serialize_row(r) for r in rows]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

@animals_bp.route('/api/animals', methods=['POST'])
@roles_required('Admin', 'Forest Officer')
def create_animal():
    conn = None
    cursor = None
    try:
        data = request.json or {}
        if not data.get('animal_name') or not data.get('species_id') or not data.get('area_id'):
            return jsonify({'error': 'Animal name, species, and protected area are required'}), 400

        tag_number = data.get('tag_number')
        if not tag_number:
            import time
            tag_number = f"TAG-{data.get('animal_name', 'X')[:3].upper()}-{int(time.time()) % 10000}"

        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            INSERT INTO Animals (animal_name, species_id, age, gender, health_status, area_id, tag_number, notes)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            data.get('animal_name'),
            int(data.get('species_id')),
            int(data.get('age', 1)),
            data.get('gender', 'Unknown'),
            data.get('health_status', 'Healthy'),
            int(data.get('area_id')),
            tag_number,
            data.get('notes', '')
        ))
        conn.commit()
        new_id = cursor.lastrowid
        cursor.execute("""
            SELECT a.*, s.common_name AS species_name, pa.area_name
            FROM Animals a
            LEFT JOIN Species s ON a.species_id = s.species_id
            LEFT JOIN Protected_Area pa ON a.area_id = pa.area_id
            WHERE a.animal_id = %s
        """, (new_id,))
        return jsonify(serialize_row(cursor.fetchone())), 201
    except Exception as e:
        if conn: conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

@animals_bp.route('/api/animals/<int:animal_id>', methods=['PUT'])
@roles_required('Admin', 'Forest Officer')
def update_animal(animal_id):
    conn = None
    cursor = None
    try:
        data = request.json or {}
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT animal_id FROM Animals WHERE animal_id = %s", (animal_id,))
        if not cursor.fetchone():
            return jsonify({'error': 'Animal not found'}), 404

        cursor.execute("""
            UPDATE Animals SET
                animal_name = %s, species_id = %s, age = %s, gender = %s,
                health_status = %s, area_id = %s, tag_number = %s, notes = %s
            WHERE animal_id = %s
        """, (
            data.get('animal_name'),
            int(data.get('species_id')),
            int(data.get('age', 1)),
            data.get('gender', 'Unknown'),
            data.get('health_status', 'Healthy'),
            int(data.get('area_id')),
            data.get('tag_number'),
            data.get('notes', ''),
            animal_id
        ))
        conn.commit()
        cursor.execute("""
            SELECT a.*, s.common_name AS species_name, pa.area_name
            FROM Animals a
            LEFT JOIN Species s ON a.species_id = s.species_id
            LEFT JOIN Protected_Area pa ON a.area_id = pa.area_id
            WHERE a.animal_id = %s
        """, (animal_id,))
        return jsonify(serialize_row(cursor.fetchone())), 200
    except Exception as e:
        if conn: conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

@animals_bp.route('/api/animals/<int:animal_id>', methods=['DELETE'])
@roles_required('Admin')
def delete_animal(animal_id):
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT animal_id FROM Animals WHERE animal_id = %s", (animal_id,))
        if not cursor.fetchone():
            return jsonify({'error': 'Animal not found'}), 404
        # Trigger before_animal_delete automatically captures archive record
        cursor.execute("DELETE FROM Animals WHERE animal_id = %s", (animal_id,))
        conn.commit()
        return jsonify({'message': 'Animal deleted and archived successfully'}), 200
    except Exception as e:
        if conn: conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()
