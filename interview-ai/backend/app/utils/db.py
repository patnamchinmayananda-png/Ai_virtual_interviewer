import os
import pymongo
from datetime import datetime
from typing import Any

# Base default in-memory database state (fallback)
_raw_users_db = {}
_raw_sessions_db = {}
_raw_reports_db = {}

class MongoDictProxy:
    def __init__(self, collection_name: str, fallback_dict: dict, db_url: str, db_name: str):
        self.collection_name = collection_name
        self.fallback = fallback_dict
        self.collection = None
        
        if db_url:
            try:
                kwargs = {"serverSelectionTimeoutMS": 5000}
                try:
                    import certifi
                    kwargs["tlsCAFile"] = certifi.where()
                except ImportError:
                    pass
                self.client = pymongo.MongoClient(db_url, **kwargs)
                self.db = self.client[db_name]
                self.collection = self.db[collection_name]
                self.client.server_info() # Test connection
            except Exception as e:
                import logging
                logging.getLogger(__name__).error(f"MongoDB connection failed for {collection_name}: {e}. Falling back to In-Memory.")
                self.collection = None

    def _deserialize(self, data: dict):
        if not data:
            return None
        data_clean = {k: v for k, v in data.items() if k != "_id"}
        
        if self.collection_name == "sessions":
            from app.models import InterviewSession
            return InterviewSession(**data_clean)
        elif self.collection_name == "reports":
            from app.models import InterviewReport
            return InterviewReport(**data_clean)
        return data_clean

    def _serialize(self, value: Any) -> dict:
        if hasattr(value, "dict"):
            return value.dict()
        elif hasattr(value, "model_dump"):
            return value.model_dump()
        return dict(value)

    def get(self, key: str, default=None):
        if self.collection is not None:
            try:
                res = self.collection.find_one({"_id": key})
                if res is not None:
                    return self._deserialize(res)
            except Exception as e:
                import logging
                logging.getLogger(__name__).error(f"MongoDB error in get({key}): {e}")
        return self.fallback.get(key, default)

    def __getitem__(self, key: str):
        val = self.get(key)
        if val is None:
            raise KeyError(key)
        return val

    def __setitem__(self, key: str, value: Any):
        if self.collection is not None:
            try:
                data = self._serialize(value)
                data["_id"] = key
                self.collection.replace_one({"_id": key}, data, upsert=True)
                return
            except Exception as e:
                import logging
                logging.getLogger(__name__).error(f"MongoDB error in setitem({key}): {e}")
        self.fallback[key] = value

    def __contains__(self, key: str) -> bool:
        if self.collection is not None:
            try:
                return self.collection.count_documents({"_id": key}) > 0
            except Exception as e:
                import logging
                logging.getLogger(__name__).error(f"MongoDB error in contains({key}): {e}")
        return key in self.fallback

    def values(self):
        if self.collection is not None:
            try:
                docs = list(self.collection.find())
                return [self._deserialize(doc) for doc in docs]
            except Exception as e:
                import logging
                logging.getLogger(__name__).error(f"MongoDB error in values(): {e}")
        return self.fallback.values()

    def pop(self, key: str, default=None):
        if self.collection is not None:
            try:
                val = self.get(key)
                if val is not None:
                    self.collection.delete_one({"_id": key})
                    return val
            except Exception as e:
                import logging
                logging.getLogger(__name__).error(f"MongoDB error in pop({key}): {e}")
        return self.fallback.pop(key, default)


# Read environment variables for database
MONGODB_URL = os.getenv("MONGODB_URL")
MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME", "interview_ai")

# Initialize Proxy collection wrappers
fake_users_db = MongoDictProxy("users", _raw_users_db, MONGODB_URL, MONGODB_DB_NAME)
fake_sessions_db = MongoDictProxy("sessions", _raw_sessions_db, MONGODB_URL, MONGODB_DB_NAME)
fake_reports_db = MongoDictProxy("reports", _raw_reports_db, MONGODB_URL, MONGODB_DB_NAME)

# Pre-seed default demo account credentials
from passlib.context import CryptContext
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
demo_email = "demo@example.com"

demo_user_record = {
    "email": demo_email,
    "full_name": "Demo User",
    "hashed_password": pwd_context.hash("password123"),
    "bio": None,
    "skills": ["Python", "JavaScript"],
    "target_role": "Software Engineer",
    "created_at": datetime.utcnow(),
    "updated_at": datetime.utcnow(),
}

# Add seed to the active database (whether MongoDB or In-Memory)
if demo_email not in fake_users_db:
    fake_users_db[demo_email] = demo_user_record
