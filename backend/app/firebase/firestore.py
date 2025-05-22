from firebase_admin import firestore
from typing import Dict, List, Optional, Any
from ..config import settings
from ..models.mock_data import get_mock_data

class FirestoreDB:
    def __init__(self):
        self.db = firestore.client() if not settings.USE_MOCK_DATA else None
        self.mock_data = get_mock_data() if settings.USE_MOCK_DATA else None

    async def get_document(self, collection: str, doc_id: str) -> Optional[Dict]:
        """Get a single document from Firestore or mock data"""
        if settings.USE_MOCK_DATA:
            return self.mock_data.get(collection, {}).get(doc_id)
        
        doc_ref = self.db.collection(collection).document(doc_id)
        doc = doc_ref.get()
        return doc.to_dict() if doc.exists else None

    async def get_collection(self, collection: str, filters: Optional[Dict] = None) -> List[Dict]:
        """Get all documents from a collection with optional filters"""
        if settings.USE_MOCK_DATA:
            items = list(self.mock_data.get(collection, {}).values())
            if filters:
                return [item for item in items if all(item.get(k) == v for k, v in filters.items())]
            return items

        query = self.db.collection(collection)
        if filters:
            for field, value in filters.items():
                query = query.where(field, "==", value)
        
        docs = query.stream()
        return [doc.to_dict() for doc in docs]

    async def add_document(self, collection: str, data: Dict, doc_id: Optional[str] = None) -> str:
        """Add a new document to Firestore"""
        if settings.USE_MOCK_DATA:
            if doc_id is None:
                doc_id = f"mock-{len(self.mock_data.get(collection, {})) + 1}"
            self.mock_data.setdefault(collection, {})[doc_id] = data
            return doc_id

        doc_ref = self.db.collection(collection).document(doc_id)
        doc_ref.set(data)
        return doc_ref.id

    async def update_document(self, collection: str, doc_id: str, data: Dict) -> bool:
        """Update an existing document in Firestore"""
        if settings.USE_MOCK_DATA:
            if collection in self.mock_data and doc_id in self.mock_data[collection]:
                self.mock_data[collection][doc_id].update(data)
                return True
            return False

        doc_ref = self.db.collection(collection).document(doc_id)
        doc = doc_ref.get()
        if doc.exists:
            doc_ref.update(data)
            return True
        return False

    async def delete_document(self, collection: str, doc_id: str) -> bool:
        """Delete a document from Firestore"""
        if settings.USE_MOCK_DATA:
            if collection in self.mock_data and doc_id in self.mock_data[collection]:
                del self.mock_data[collection][doc_id]
                return True
            return False

        doc_ref = self.db.collection(collection).document(doc_id)
        doc = doc_ref.get()
        if doc.exists:
            doc_ref.delete()
            return True
        return False

# Create a singleton instance
db = FirestoreDB() 