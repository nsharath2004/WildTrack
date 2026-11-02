from flask import Blueprint, jsonify
from services.db_service import get_db_connection, serialize_row
from middleware.auth import token_required

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/api/dashboard/stats', methods=['GET'])
@token_required
def get_dashboard_stats():
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        stats = {}

        cursor.execute("SELECT COUNT(*) AS total FROM Animals")
        stats['total_animals'] = cursor.fetchone()['total']

        cursor.execute("SELECT COUNT(*) AS total FROM Species")
        stats['total_species'] = cursor.fetchone()['total']

        cursor.execute("SELECT COUNT(*) AS total FROM Protected_Area")
        total_areas = cursor.fetchone()['total']
        stats['total_areas'] = total_areas
        stats['protected_areas'] = total_areas

        cursor.execute("SELECT COUNT(*) AS total FROM Sightings")
        stats['total_sightings'] = cursor.fetchone()['total']

        cursor.execute("""
            SELECT COUNT(*) AS total FROM Species
            WHERE conservation_status IN ('Endangered', 'Critically Endangered')
        """)
        stats['endangered_species'] = cursor.fetchone()['total']

        cursor.execute("SELECT COUNT(*) AS total FROM Projects WHERE status = 'Active'")
        stats['active_projects'] = cursor.fetchone()['total']

        cursor.execute("SELECT COUNT(*) AS total FROM Researchers")
        stats['total_researchers'] = cursor.fetchone()['total']

        cursor.execute("SELECT COUNT(*) AS total FROM Volunteers WHERE status = 'Active'")
        stats['total_volunteers'] = cursor.fetchone()['total']

        cursor.execute("SELECT COUNT(*) AS total FROM Threats WHERE status = 'Active'")
        stats['active_threats'] = cursor.fetchone()['total']

        cursor.execute("SELECT COUNT(*) AS total FROM Incidents WHERE status IN ('Open', 'Under Investigation')")
        stats['critical_incidents'] = cursor.fetchone()['total']

        cursor.execute("SELECT COUNT(*) AS total FROM Veterinary")
        stats['veterinary_records'] = cursor.fetchone()['total']

        return jsonify(stats), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

@dashboard_bp.route('/api/dashboard/population-chart', methods=['GET'])
@token_required
def get_population_chart():
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT s.common_name AS species_name, COUNT(a.animal_id) AS animal_count
            FROM Species s
            LEFT JOIN Animals a ON s.species_id = a.species_id
            GROUP BY s.species_id, s.common_name
            ORDER BY animal_count DESC
        """)
        rows = cursor.fetchall()
        return jsonify([serialize_row(r) for r in rows]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

@dashboard_bp.route('/api/dashboard/species-distribution', methods=['GET'])
@token_required
def get_species_distribution():
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

@dashboard_bp.route('/api/dashboard/animals-by-area', methods=['GET'])
@token_required
def get_animals_by_area():
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT pa.area_name, COUNT(a.animal_id) AS animal_count, pa.area_size_km2
            FROM Protected_Area pa
            LEFT JOIN Animals a ON pa.area_id = a.area_id
            GROUP BY pa.area_id, pa.area_name, pa.area_size_km2
            ORDER BY animal_count DESC
        """)
        rows = cursor.fetchall()
        return jsonify([serialize_row(r) for r in rows]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

@dashboard_bp.route('/api/dashboard/threats-by-severity', methods=['GET'])
@token_required
def get_threats_by_severity():
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT severity, COUNT(*) AS count
            FROM Threats
            GROUP BY severity
            ORDER BY FIELD(severity, 'Critical', 'High', 'Medium', 'Low')
        """)
        rows = cursor.fetchall()
        return jsonify([serialize_row(r) for r in rows]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

@dashboard_bp.route('/api/dashboard/monthly-sightings', methods=['GET'])
@token_required
def get_monthly_sightings():
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT DATE_FORMAT(sighting_date, '%b %Y') AS month_label,
                   COUNT(*) AS sighting_count
            FROM Sightings
            GROUP BY DATE_FORMAT(sighting_date, '%Y-%m'), DATE_FORMAT(sighting_date, '%b %Y')
            ORDER BY MIN(sighting_date) ASC
        """)
        rows = cursor.fetchall()
        return jsonify([serialize_row(r) for r in rows]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

@dashboard_bp.route('/api/dashboard/recent-sightings', methods=['GET'])
@token_required
def get_recent_sightings():
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT si.sighting_id, si.sighting_date, si.sighting_time,
                   si.observed_by, si.location_description, si.notes,
                   a.animal_name, a.tag_number, s.common_name AS species_name,
                   pa.area_name
            FROM Sightings si
            LEFT JOIN Animals a ON si.animal_id = a.animal_id
            LEFT JOIN Species s ON a.species_id = s.species_id
            LEFT JOIN Protected_Area pa ON si.area_id = pa.area_id
            ORDER BY si.sighting_date DESC, si.sighting_time DESC
            LIMIT 6
        """)
        rows = cursor.fetchall()
        return jsonify([serialize_row(r) for r in rows]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

@dashboard_bp.route('/api/dashboard/recent-threats', methods=['GET'])
@token_required
def get_recent_threats():
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT t.threat_id, t.threat_type, t.severity, t.location,
                   t.threat_date, t.description, t.reported_by, t.status
            FROM Threats t
            ORDER BY t.threat_date DESC, t.threat_id DESC
            LIMIT 5
        """)
        rows = cursor.fetchall()
        return jsonify([serialize_row(r) for r in rows]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()
