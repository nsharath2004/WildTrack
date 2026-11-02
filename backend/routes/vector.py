from flask import Blueprint, jsonify, request
from services.chroma_service import chroma_service
from middleware.auth import token_required, roles_required

vector_bp = Blueprint('vector', __name__)

# Sample knowledge documents to seed vector store
DEFAULT_KNOWLEDGE_DOCS = [
    {
        "id": "KB-THREAT-001",
        "document": "Steel clutch wire snares detected along game trails in Bandipur South Buffer Zone. Poachers target spotted deer and leopards for bushmeat and contraband.",
        "metadata": {"category": "Poaching Threat", "severity": "Critical", "location": "Bandipur National Park"}
    },
    {
        "id": "KB-INCIDENT-002",
        "document": "Asiatic elephant bull crop depredation and human-wildlife conflict at Machur village perimeter. Solar fencing breached and sugarcane crops raided.",
        "metadata": {"category": "Elephant Conflict", "severity": "High", "location": "Nagarhole Border"}
    },
    {
        "id": "KB-VET-003",
        "document": "Emergency immobilization and wound debridement of female leopard Chitra for severe right forelimb wire snare laceration and localized cellulitis.",
        "metadata": {"category": "Veterinary Surgery", "animal": "Indian Leopard", "status": "Under Treatment"}
    },
    {
        "id": "KB-RESEARCH-004",
        "document": "Camera trap abundance census of Bengal Tigers and Indian Leopards across the Nilgiri Biosphere corridor connecting Bandipur and Wayanad sanctuaries.",
        "metadata": {"category": "Tiger Research", "lead": "Dr. Ramesh Kumar", "status": "Active"}
    },
    {
        "id": "KB-HABITAT-005",
        "document": "Severe Lantana camara and Senna spectabilis invasive weed proliferation suffocating native palatable grass regeneration for herbivores in moist deciduous forest.",
        "metadata": {"category": "Habitat Destruction", "impact": "High", "reserve": "Bandipur National Park"}
    },
    {
        "id": "KB-RHINO-006",
        "document": "Greater one-horned rhinoceros population monitoring in Kaziranga central grassland floodplain wetlands. Calf health and siltation wallowing behaviors observed.",
        "metadata": {"category": "Species Conservation", "species": "Indian Rhinoceros", "location": "Kaziranga"}
    },
    {
        "id": "KB-DISEASE-007",
        "document": "Canine Distemper Virus (CDV) surveillance in feral dog packs on core forest boundaries to prevent deadly transmission into wild carnivore tiger populations.",
        "metadata": {"category": "Disease Outbreak", "severity": "Critical", "pathogen": "CDV"}
    }
]

@vector_bp.route('/api/vector/seed', methods=['POST'])
@token_required
def seed_knowledge_base():
    """Seed initial wildlife conservation documents into Chroma vector store."""
    count = 0
    for item in DEFAULT_KNOWLEDGE_DOCS:
        chroma_service.add_document(item['id'], item['document'], item['metadata'])
        count += 1
    return jsonify({'message': f'Successfully indexed {count} wildlife knowledge documents into ChromaDB.', 'count': count}), 200

@vector_bp.route('/api/vector/search', methods=['POST'])
@token_required
def semantic_search():
    """
    Search ChromaDB vector database using natural-language queries.
    Returns semantic nearest neighbors ranked by cosine vector similarity.
    """
    data = request.json or {}
    query = data.get('query', '').strip()
    n_results = int(data.get('n_results', 5))

    if not query:
        return jsonify({'error': 'Search query text is required'}), 400

    # Auto-seed if collection is currently empty
    docs = chroma_service.list_documents()
    if len(docs) == 0:
        for item in DEFAULT_KNOWLEDGE_DOCS:
            chroma_service.add_document(item['id'], item['document'], item['metadata'])

    results = chroma_service.search_semantic(query, n_results=n_results)
    return jsonify({
        'query': query,
        'results_count': len(results),
        'results': results
    }), 200

@vector_bp.route('/api/vector/documents', methods=['GET'])
@token_required
def list_vector_documents():
    """List all documents currently embedded and stored in the vector database."""
    docs = chroma_service.list_documents()
    if len(docs) == 0:
        for item in DEFAULT_KNOWLEDGE_DOCS:
            chroma_service.add_document(item['id'], item['document'], item['metadata'])
        docs = chroma_service.list_documents()

    # Format output without heavy embeddings for UI display
    output = []
    for d in docs:
        output.append({
            'id': d['id'],
            'document': d['document'],
            'metadata': d.get('metadata', {}),
            'updated_at': d.get('updated_at')
        })
    return jsonify(output), 200

@vector_bp.route('/api/vector/documents', methods=['POST'])
@token_required
def add_vector_document():
    """Add a new custom document with vector embedding to ChromaDB."""
    data = request.json or {}
    doc_id = data.get('id')
    document = data.get('document')
    metadata = data.get('metadata', {})

    if not document:
        return jsonify({'error': 'Document content is required'}), 400

    if not doc_id:
        import time
        doc_id = f"KB-CUSTOM-{int(time.time())}"

    res = chroma_service.add_document(doc_id, document, metadata)
    return jsonify({'message': 'Document vectorized and saved', 'document': res}), 201

@vector_bp.route('/api/vector/documents/<doc_id>', methods=['PUT'])
@token_required
def update_vector_document(doc_id):
    """Update an existing vector document and recompute embedding."""
    data = request.json or {}
    document = data.get('document')
    metadata = data.get('metadata', {})

    if not document:
        return jsonify({'error': 'Document content is required'}), 400

    res = chroma_service.update_document(doc_id, document, metadata)
    if not res:
        return jsonify({'error': 'Document not found in vector database'}), 404
    return jsonify({'message': 'Document updated and re-indexed', 'document': res}), 200

@vector_bp.route('/api/vector/documents/<doc_id>', methods=['DELETE'])
@token_required
def delete_vector_document(doc_id):
    """Delete a document and its embedding from ChromaDB."""
    success = chroma_service.delete_document(doc_id)
    if not success:
        return jsonify({'error': 'Document not found'}), 404
    return jsonify({'message': 'Document deleted from vector store'}), 200
