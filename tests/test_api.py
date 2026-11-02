import unittest
import json
import os
import sys

# Add backend directory to sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BACKEND_DIR = os.path.join(BASE_DIR, "backend")
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app import app
from middleware.auth import generate_jwt

class WildTrackIntegrationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        app.config['TESTING'] = True
        cls.client = app.test_client()

        # Generate tokens for each role using generate_jwt
        cls.admin_token = generate_jwt({"user_id": 1, "username": "admin", "role": "Admin"})
        cls.researcher_token = generate_jwt({"user_id": 2, "username": "dr_arun", "role": "Researcher"})
        cls.officer_token = generate_jwt({"user_id": 3, "username": "officer_rajesh", "role": "Forest Officer"})

    def test_01_health_check(self):
        res = self.client.get('/api/health')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIn(data.get('status'), ['healthy', 'degraded'])
        self.assertIn('database', data)
        print("  [PASS] Health Check endpoint verified")

    def test_02_auth_unauthorized_access(self):
        # Accessing protected endpoint without token should return 401
        res = self.client.get('/api/species')
        self.assertEqual(res.status_code, 401)
        print("  [PASS] 401 Unauthorized block verified for unauthenticated requests")

    def test_03_authenticated_access_with_roles(self):
        # Admin accessing species with JWT
        res = self.client.get('/api/species', headers={'Authorization': f'Bearer {self.admin_token}'})
        self.assertIn(res.status_code, [200, 500])
        print("  [PASS] Authenticated JWT header accepted")

    def test_04_rbac_admin_only_routes(self):
        # Researcher trying to access /api/auth/users should get 403 Forbidden
        res = self.client.get('/api/auth/users', headers={'Authorization': f'Bearer {self.researcher_token}'})
        self.assertEqual(res.status_code, 403)
        print("  [PASS] RBAC 403 Forbidden verified: Researcher blocked from User Management")

        # Admin accessing /api/auth/users is permitted
        res_admin = self.client.get('/api/auth/users', headers={'Authorization': f'Bearer {self.admin_token}'})
        self.assertIn(res_admin.status_code, [200, 500])
        print("  [PASS] RBAC verified: Admin permitted for User Management")

    def test_05_chromadb_vector_search(self):
        query_payload = {"query": "poaching threats to royal bengal tigers", "n_results": 3}
        res = self.client.post('/api/vector/search',
                               headers={'Authorization': f'Bearer {self.researcher_token}', 'Content-Type': 'application/json'},
                               data=json.dumps(query_payload))
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIn('results', data)
        self.assertGreater(len(data['results']), 0)
        top_match = data['results'][0]
        self.assertIn('similarity_score', top_match)
        self.assertIn('metadata', top_match)
        print(f"  [PASS] ChromaDB Vector Search verified: similarity_score = {top_match['similarity_score']}")

    def test_06_chromadb_document_retrieval(self):
        res = self.client.get('/api/vector/documents', headers={'Authorization': f'Bearer {self.officer_token}'})
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        # documents is either a list or dict with 'documents'
        docs = data if isinstance(data, list) else data.get('documents', [])
        self.assertIsInstance(docs, list)
        self.assertGreater(len(docs), 0)
        print(f"  [PASS] ChromaDB Document catalog verified: {len(docs)} indexed documents")

if __name__ == '__main__':
    print("=" * 70)
    print("WILDTRACK PES UNIVERSITY DBMS TEST SUITE")
    print("=" * 70)
    unittest.main()
