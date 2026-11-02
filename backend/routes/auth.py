from flask import Blueprint, jsonify, request, g
import werkzeug.security as ws
from services.db_service import get_db_connection, serialize_row
from middleware.auth import generate_jwt, token_required, roles_required

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/api/auth/login', methods=['POST'])
def login():
    """Authenticate user with username/email and password, returning JWT token and profile."""
    data = request.json or {}
    identifier = data.get('username') or data.get('email')
    password = data.get('password')

    if not identifier or not password:
        return jsonify({'error': 'Username/email and password are required'}), 400

    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT user_id, username, email, password_hash, full_name, role, badge_number, is_active
            FROM Users
            WHERE (username = %s OR email = %s)
            LIMIT 1
        """, (identifier, identifier))
        user = cursor.fetchone()

        if not user:
            return jsonify({'error': 'Invalid username or password'}), 401

        if not user.get('is_active'):
            return jsonify({'error': 'Your account has been deactivated. Please contact the administrator.'}), 403

        # Verify password hash
        is_valid = ws.check_password_hash(user['password_hash'], password)
        if not is_valid:
            # Fallback simple check for development seed passwords if needed
            if user['password_hash'] == password:
                is_valid = True

        if not is_valid:
            return jsonify({'error': 'Invalid username or password'}), 401

        # Generate JWT
        token_payload = {
            'user_id': user['user_id'],
            'username': user['username'],
            'full_name': user['full_name'],
            'email': user['email'],
            'role': user['role'],
            'badge_number': user.get('badge_number')
        }
        token = generate_jwt(token_payload)

        return jsonify({
            'message': 'Login successful',
            'token': token,
            'user': token_payload
        }), 200

    except Exception as e:
        return jsonify({'error': f'Database connection error: {str(e)}'}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

@auth_bp.route('/api/auth/me', methods=['GET'])
@token_required
def get_current_user():
    """Retrieve authenticated user identity from verified JWT."""
    return jsonify({'user': g.current_user}), 200

@auth_bp.route('/api/auth/users', methods=['GET'])
@roles_required('Admin')
def get_all_users():
    """Admin-only: Retrieve all system user accounts."""
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT user_id, username, email, full_name, role, badge_number, phone, is_active, created_at, updated_at
            FROM Users
            ORDER BY created_at DESC
        """)
        users = cursor.fetchall()
        return jsonify([serialize_row(u) for u in users]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

@auth_bp.route('/api/auth/users', methods=['POST'])
@roles_required('Admin')
def create_user():
    """Admin-only: Enroll a new user with role-based credentials."""
    data = request.json or {}
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    full_name = data.get('full_name')
    role = data.get('role', 'Forest Officer')
    badge_number = data.get('badge_number')
    phone = data.get('phone')

    if not username or not email or not password or not full_name:
        return jsonify({'error': 'Username, email, password, and full name are required'}), 400

    if role not in ['Admin', 'Researcher', 'Forest Officer']:
        return jsonify({'error': 'Invalid role. Must be Admin, Researcher, or Forest Officer'}), 400

    password_hash = ws.generate_password_hash(password)

    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            INSERT INTO Users (username, email, password_hash, full_name, role, badge_number, phone, is_active)
            VALUES (%s, %s, %s, %s, %s, %s, %s, 1)
        """, (username, email, password_hash, full_name, role, badge_number, phone))
        conn.commit()
        new_id = cursor.lastrowid
        cursor.execute("SELECT user_id, username, email, full_name, role, badge_number, is_active FROM Users WHERE user_id = %s", (new_id,))
        return jsonify(serialize_row(cursor.fetchone())), 201
    except Exception as e:
        if conn: conn.rollback()
        return jsonify({'error': f'Failed to create user: {str(e)}'}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

@auth_bp.route('/api/auth/users/<int:user_id>/status', methods=['PATCH'])
@roles_required('Admin')
def toggle_user_status(user_id):
    """Admin-only: Activate or deactivate a user account."""
    data = request.json or {}
    is_active = 1 if data.get('is_active', True) else 0

    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("UPDATE Users SET is_active = %s WHERE user_id = %s", (is_active, user_id))
        conn.commit()
        return jsonify({'message': 'User status updated successfully'}), 200
    except Exception as e:
        if conn: conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

@auth_bp.route('/api/auth/users/<int:user_id>', methods=['DELETE'])
@roles_required('Admin')
def delete_user(user_id):
    """Admin-only: Delete a user account."""
    if g.current_user.get('user_id') == user_id:
        return jsonify({'error': 'Cannot delete your own active administrator account'}), 400

    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("DELETE FROM Users WHERE user_id = %s", (user_id,))
        conn.commit()
        return jsonify({'message': 'User deleted successfully'}), 200
    except Exception as e:
        if conn: conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()
