from flask import Blueprint, jsonify, request
from services.db_service import get_db_connection, serialize_row
from middleware.auth import token_required, roles_required

veterinary_bp = Blueprint('veterinary', __name__)

@veterinary_bp.route('/api/veterinary', methods=['GET'])
@token_required
def get_all_records():
    conn = None
    cursor = None
    try:
        animal_id = request.args.get('animal_id')
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        sql = """
            SELECT v.*, a.animal_name, a.tag_number, s.common_name AS species_name
            FROM Veterinary v
            LEFT JOIN Animals a ON v.animal_id = a.animal_id
            LEFT JOIN Species s ON a.species_id = s.species_id
            WHERE 1=1
        """
        params = []
        if animal_id:
            sql += " AND v.animal_id = %s"
            params.append(int(animal_id))

        sql += " ORDER BY v.treatment_date DESC, v.vet_id DESC"
        cursor.execute(sql, tuple(params))
        rows = cursor.fetchall()
        return jsonify([serialize_row(r) for r in rows]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

@veterinary_bp.route('/api/veterinary/<int:vet_id>', methods=['GET'])
@token_required
def get_record(vet_id):
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT v.*, a.animal_name, a.tag_number, s.common_name AS species_name
            FROM Veterinary v
            LEFT JOIN Animals a ON v.animal_id = a.animal_id
            LEFT JOIN Species s ON a.species_id = s.species_id
            WHERE v.vet_id = %s
        """, (vet_id,))
        row = cursor.fetchone()
        if not row:
            return jsonify({'error': 'Veterinary record not found'}), 404
        return jsonify(serialize_row(row)), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

@veterinary_bp.route('/api/veterinary', methods=['POST'])
@roles_required('Admin', 'Forest Officer')
def create_record():
    data = request.json or {}
    if not data.get('animal_id') or not data.get('diagnosis') or not data.get('treatment') or not data.get('treatment_date'):
        return jsonify({'error': 'Animal, diagnosis, treatment, and treatment date are required'}), 400

    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            INSERT INTO Veterinary (animal_id, diagnosis, treatment, veterinarian_name, treatment_date, follow_up_date, medication, cost, notes)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            int(data.get('animal_id')),
            data.get('diagnosis'),
            data.get('treatment'),
            data.get('veterinarian_name', 'Senior Wildlife Veterinarian'),
            data.get('treatment_date'),
            data.get('follow_up_date') or None,
            data.get('medication', ''),
            float(data.get('cost', 0) or 0),
            data.get('notes', '')
        ))
        conn.commit()
        new_id = cursor.lastrowid
        cursor.execute("""
            SELECT v.*, a.animal_name, a.tag_number
            FROM Veterinary v
            LEFT JOIN Animals a ON v.animal_id = a.animal_id
            WHERE v.vet_id = %s
        """, (new_id,))
        return jsonify(serialize_row(cursor.fetchone())), 201
    except Exception as e:
        if conn: conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

@veterinary_bp.route('/api/veterinary/<int:vet_id>', methods=['PUT'])
@roles_required('Admin', 'Forest Officer')
def update_record(vet_id):
    data = request.json or {}
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT vet_id FROM Veterinary WHERE vet_id = %s", (vet_id,))
        if not cursor.fetchone():
            return jsonify({'error': 'Veterinary record not found'}), 404

        cursor.execute("""
            UPDATE Veterinary SET
                animal_id = %s, diagnosis = %s, treatment = %s,
                veterinarian_name = %s, treatment_date = %s, follow_up_date = %s,
                medication = %s, cost = %s, notes = %s
            WHERE vet_id = %s
        """, (
            int(data.get('animal_id')),
            data.get('diagnosis'),
            data.get('treatment'),
            data.get('veterinarian_name', ''),
            data.get('treatment_date'),
            data.get('follow_up_date') or None,
            data.get('medication', ''),
            float(data.get('cost', 0) or 0),
            data.get('notes', ''),
            vet_id
        ))
        conn.commit()
        cursor.execute("""
            SELECT v.*, a.animal_name, a.tag_number
            FROM Veterinary v
            LEFT JOIN Animals a ON v.animal_id = a.animal_id
            WHERE v.vet_id = %s
        """, (vet_id,))
        return jsonify(serialize_row(cursor.fetchone())), 200
    except Exception as e:
        if conn: conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

@veterinary_bp.route('/api/veterinary/<int:vet_id>', methods=['DELETE'])
@roles_required('Admin')
def delete_record(vet_id):
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT vet_id FROM Veterinary WHERE vet_id = %s", (vet_id,))
        if not cursor.fetchone():
            return jsonify({'error': 'Veterinary record not found'}), 404
        cursor.execute("DELETE FROM Veterinary WHERE vet_id = %s", (vet_id,))
        conn.commit()
        return jsonify({'message': 'Veterinary record deleted successfully'}), 200
    except Exception as e:
        if conn: conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()
