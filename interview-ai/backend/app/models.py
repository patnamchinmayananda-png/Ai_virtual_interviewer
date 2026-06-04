from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from datetime import datetime
from enum import Enum

# Enums
class InterviewType(str, Enum):
    HR = "hr"
    TECHNICAL = "technical"
    BEHAVIORAL = "behavioral"
    SYSTEM_DESIGN = "system_design"

class JobRole(str, Enum):
    SOFTWARE_ENGINEER = "software_engineer"
    AI_ENGINEER = "ai_engineer"
    FRONTEND_DEVELOPER = "frontend_developer"
    BACKEND_DEVELOPER = "backend_developer"
    DATA_ANALYST = "data_analyst"

class DifficultyLevel(str, Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    FRESHER = "fresher"
    SDE_1 = "sde_1"
    SDE_2 = "sde_2"

class SessionStatus(str, Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    PAUSED = "paused"
    FAILED = "failed"

# User Models
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    bio: Optional[str] = None
    skills: Optional[List[str]] = None
    target_role: Optional[str] = None

class User(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    email: str
    full_name: str
    bio: Optional[str] = None
    skills: List[str] = []
    target_role: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        from_attributes = True

# Authentication Models
class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: User

class TokenData(BaseModel):
    email: Optional[str] = None

# Interview Configuration
class InterviewConfig(BaseModel):
    interview_type: InterviewType
    job_role: JobRole
    difficulty: DifficultyLevel
    duration_minutes: int = 30
    user_id: Optional[str] = None
    resume_text: Optional[str] = None

# Interview Session
class InterviewSession(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    user_id: str
    config: InterviewConfig
    status: SessionStatus = SessionStatus.ACTIVE
    questions: List[str] = []
    answers: List[dict] = []
    scores: List[float] = []
    overall_score: Optional[float] = None
    feedback: Optional[str] = None
    transcript: List[dict] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    duration_seconds: Optional[int] = None

    class Config:
        from_attributes = True

# Question Model
class Question(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    interview_type: InterviewType
    job_role: JobRole
    difficulty: DifficultyLevel
    question_text: str
    hints: Optional[List[str]] = None
    expected_keywords: Optional[List[str]] = None
    follow_up_questions: Optional[List[str]] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        from_attributes = True

# Answer Model
class Answer(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    session_id: str
    question_id: str
    answer_text: str
    audio_path: Optional[str] = None
    technical_score: Optional[float] = None
    communication_score: Optional[float] = None
    confidence_score: Optional[float] = None
    overall_score: Optional[float] = None
    feedback: Optional[str] = None
    improvements: Optional[List[str]] = None
    strengths: Optional[List[str]] = None
    weaknesses: Optional[List[str]] = None
    filler_word_count: Optional[int] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        from_attributes = True

# Report Model
class InterviewReport(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    session_id: str
    user_id: str
    overall_score: float
    technical_score: float
    communication_score: float
    confidence_score: float
    strengths: List[str]
    weaknesses: List[str]
    improvements: List[str]
    learning_resources: Optional[List[dict]] = None
    roadmap: Optional[List[dict]] = None
    transcript: List[dict]
    generated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        from_attributes = True

# Analytics Models
class PerformanceMetrics(BaseModel):
    total_interviews: int
    average_score: float
    technical_avg: float
    communication_avg: float
    confidence_avg: float
    improvement_trend: List[float]
    topic_strengths: dict
    topic_weaknesses: dict
    last_updated: datetime = Field(default_factory=datetime.utcnow)

class PaginationParams(BaseModel):
    skip: int = 0
    limit: int = 10
