from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordBearer
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr
from typing import Optional
import os

SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

router = APIRouter()

fake_users_db = {
    "demo@example.com": {
        "email": "demo@example.com",
        "full_name": "Demo User",
        "hashed_password": pwd_context.hash("password123"),
        "bio": None,
        "skills": ["Python", "JavaScript"],
        "target_role": "Software Engineer",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
}

class UserCreate(BaseModel):
    email: str
    password: str
    full_name: str

class UserLogin(BaseModel):
    email: str
    password: str

class User(BaseModel):
    id: Optional[str] = None
    email: str
    full_name: str
    bio: Optional[str] = None
    skills: list = []
    target_role: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: User

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = fake_users_db.get(email)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return User(id=email, **{k: v for k, v in user.items() if k != "hashed_password"})

@router.post("/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    if user_data.email in fake_users_db:
        raise HTTPException(status_code=400, detail="Email already registered")
    now = datetime.utcnow()
    fake_users_db[user_data.email] = {
        "email": user_data.email,
        "full_name": user_data.full_name,
        "hashed_password": pwd_context.hash(user_data.password),
        "bio": None, "skills": [], "target_role": None,
        "created_at": now, "updated_at": now,
    }
    token = create_access_token({"sub": user_data.email})
    user = User(id=user_data.email, email=user_data.email, full_name=user_data.full_name)
    return TokenResponse(access_token=token, user=user)

@router.post("/login", response_model=TokenResponse)
async def login(user_data: UserLogin):
    user = fake_users_db.get(user_data.email)
    if not user or not pwd_context.verify(user_data.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token({"sub": user_data.email})
    user_obj = User(id=user_data.email, **{k: v for k, v in user.items() if k != "hashed_password"})
    return TokenResponse(access_token=token, user=user_obj)

@router.get("/me", response_model=User)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user
