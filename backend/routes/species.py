from flask import Blueprint, jsonify, request
from services.db_service import get_db_connection, serialize_row
from middleware.auth import token_required, roles_required

species_bp = Blueprint('species', __name__)

@species_bp.route('/api/species', methods=['GET'])
@token_required
def get_all_species():
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT s.*, COUNT(a.animal_id) AS animal_count
            FROM Species s
            LEFT JOIN Animals a ON s.species_id = a.species_id
            GROUP BY s.species_id, s.common_name, s.scientific_name, s.category, s.conservation_status, s.description, s.created_at
            ORDER BY s.common_name ASC
        """)
        rows = cursor.fetchall()
        return jsonify([serialize_row(r) for r in rows]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

@species_bp.route('/api/species/stats', methods=['GET'])
@token_required
def get_species_stats():
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT conservation_status, COUNT(*) AS count
            FROM Species
            GROUP BY conservation_status
            ORDER BY count DESC
        """)
        rows = cursor.fetchall()
        return jsonify([serialize_row(r) for r in rows]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

@species_bp.route('/api/species/<int:species_id>', methods=['GET'])
@token_required
def get_species(species_id):
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM Species WHERE species_id = %s", (species_id,))
        row = cursor.fetchone()
        if not row:
            return jsonify({'error': 'Species not found'}), 404
        return jsonify(serialize_row(row)), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

@species_bp.route('/api/species', methods=['POST'])
@roles_required('Admin', 'Researcher')
def create_species():
    conn = None
    cursor = None
    try:
        data = request.json or {}
        if not data.get('common_name') or not data.get('scientific_name'):
            return jsonify({'error': 'Common name and scientific name are required'}), 400
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            INSERT INTO Species (common_name, scientific_name, category, conservation_status, description)
            VALUES (%s, %s, %s, %s, %s)
        """, (
            data.get('common_name'),
            data.get('scientific_name'),
            data.get('category', 'Mammal'),
            data.get('conservation_status', 'Least Concern'),
            data.get('description', '')
        ))
        conn.commit()
        new_id = cursor.lastrowid
        cursor.execute("SELECT * FROM Species WHERE species_id = %s", (new_id,))
        return jsonify(serialize_row(cursor.fetchone())), 201
    except Exception as e:
        if conn: conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

@species_bp.route('/api/species/<int:species_id>', methods=['PUT'])
@roles_required('Admin', 'Researcher')
def update_species(species_id):
    conn = None
    cursor = None
    try:
        data = request.json or {}
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT species_id FROM Species WHERE species_id = %s", (species_id,))
        if not cursor.fetchone():
            return jsonify({'error': 'Species not found'}), 404
        cursor.execute("""
            UPDATE Species SET
                common_name = %s, scientific_name = %s, category = %s,
                conservation_status = %s, description = %s
            WHERE species_id = %s
        """, (
            data.get('common_name'),
            data.get('scientific_name'),
            data.get('category'),
            data.get('conservation_status'),
            data.get('description'),
            species_id
        ))
        conn.commit()
        cursor.execute("SELECT * FROM Species WHERE species_id = %s", (species_id,))
        return jsonify(serialize_row(cursor.fetchone())), 200
    except Exception as e:
        if conn: conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

@species_bp.route('/api/species/<int:species_id>', methods=['DELETE'])
@roles_required('Admin')
def delete_species(species_id):
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT species_id FROM Species WHERE species_id = %s", (species_id,))
        if not cursor.fetchone():
            return jsonify({'error': 'Species not found'}), 404
        cursor.execute("DELETE FROM Species WHERE species_id = %s", (species_id,))
        conn.commit()
        return jsonify({'message': 'Species deleted successfully'}), 200
    except Exception as e:
        if conn: conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()
