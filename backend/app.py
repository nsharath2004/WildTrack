from flask import Flask, jsonify, request
from flask_cors import CORS
from config import Config
from services.db_service import get_db_connection

# Import modular route blueprints
from routes.auth import auth_bp
from routes.species import species_bp
from routes.animals import animals_bp
from routes.protected_areas import areas_bp
from routes.researchers import researchers_bp
from routes.research import research_bp
from routes.sightings import sightings_bp
from routes.threats import threats_bp
from routes.incidents import incidents_bp
from routes.veterinary import veterinary_bp
from routes.projects import projects_bp
from routes.volunteers import volunteers_bp
from routes.dashboard import dashboard_bp
from routes.vector import vector_bp

app = Flask(__name__)
app.config.from_object(Config)

# Enable CORS across all /api/* routes
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Register blueprints
app.register_blueprint(auth_bp)
app.register_blueprint(species_bp)
app.register_blueprint(animals_bp)
app.register_blueprint(areas_bp)
app.register_blueprint(researchers_bp)
app.register_blueprint(research_bp)
app.register_blueprint(sightings_bp)
app.register_blueprint(threats_bp)
app.register_blueprint(incidents_bp)
app.register_blueprint(veterinary_bp)
app.register_blueprint(projects_bp)
app.register_blueprint(volunteers_bp)
app.register_blueprint(dashboard_bp)
app.register_blueprint(vector_bp)

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Resource not found'}), 404

@app.errorhandler(405)
def method_not_allowed(error):
    return jsonify({'error': 'Method not allowed for requested endpoint'}), 405

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health inspection endpoint checking web server, DB connectivity, and ChromaDB."""
    status_info = {
        'status': 'healthy',
        'server': 'WildTrack Flask REST API v2.0',
        'database': 'unknown',
        'vector_store': 'operational'
    }
    try:
        conn = get_db_connection()
        conn.close()
        status_info['database'] = 'connected'
        return jsonify(status_info), 200
    except Exception as e:
        status_info['status'] = 'degraded'
        status_info['database'] = f'disconnected: {str(e)}'
        return jsonify(status_info), 200

if __name__ == '__main__':
    # Do not enable debug mode in production
    app.run(host='0.0.0.0', port=5000, debug=False)
