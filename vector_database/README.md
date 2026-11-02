# ChromaDB Vector Database for WildTrack

This directory contains the ChromaDB vector database storage and documentation for the semantic knowledge search component of **WildTrack**.

---

## 🔍 Overview

WildTrack integrates a vector database to provide **semantic similarity search** over unstructured wildlife conservation records. Unlike traditional keyword matching (`LIKE '%keyword%'`), vector embeddings allow conservation authorities, researchers, and rangers to query reports using conceptual natural language.

---

## 🛠️ How to Install and Start ChromaDB

### 1. Install ChromaDB in your Python environment:
```bash
pip install chromadb
```

### 2. Verify ChromaDB Installation:
```python
import chromadb
client = chromadb.PersistentClient(path="./chroma_data")
collection = client.get_or_create_collection("wildlife_knowledge")
print("ChromaDB initialized successfully!")
```

---

## 📦 What is Stored in ChromaDB?

1. **Poaching & Threat Descriptions**: Wire snare discoveries, illegal entry reports, and perimeter violations.
2. **Emergency Incidents**: Human-elephant crop depredation, leopard rescues, and tiger territory clashes.
3. **Veterinary Clinical Notes**: Wound debridement procedures, parasite treatments, and medication regimens.
4. **Conservation Research Logs**: Camera trap census surveys, radio-collar telemetry tracking, and habitat studies.

---

## 🚀 API Endpoints Provided by Flask Backend

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/vector/seed` | Seed standard wildlife knowledge documents |
| `POST` | `/api/vector/search` | Execute natural-language semantic similarity query |
| `GET` | `/api/vector/documents` | List all embedded documents with metadata |
| `POST` | `/api/vector/documents` | Add and embed a new conservation document |
| `PUT` | `/api/vector/documents/<id>`| Update document text and recalculate embedding |
| `DELETE`| `/api/vector/documents/<id>`| Delete document and remove from vector index |

---

## 🧪 Example Semantic Queries

- `"Find incidents involving elephant-human conflict."`
- `"Show reports about habitat destruction and invasive weeds."`
- `"Find conservation observations related to Bengal Tigers."`
- `"Show veterinary treatments involving wire snare injuries."`
