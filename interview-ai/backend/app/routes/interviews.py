import uuid
from datetime import datetime
from typing import List, Optional, Dict
from fastapi import APIRouter, HTTPException, Depends, status, File, UploadFile
from pydantic import BaseModel
import io
import PyPDF2

from app.models import (
    InterviewConfig,
    InterviewSession,
    Question,
    Answer,
    InterviewReport,
    SessionStatus
)
from app.routes.auth import get_current_user, User
from app.services.ai_service import AIService
from app.utils.db import fake_sessions_db, fake_reports_db

router = APIRouter()
ai_service = AIService()

@router.post("/upload-resume")
async def upload_resume(file: UploadFile = File(...), current_user: User = Depends(get_current_user)):
    filename = file.filename.lower()
    content = await file.read()
    
    parsed_text = ""
    
    if filename.endswith(".pdf"):
        try:
            pdf_file = io.BytesIO(content)
            pdf_reader = PyPDF2.PdfReader(pdf_file)
            
            extracted_pages = []
            for page in pdf_reader.pages:
                txt = page.extract_text()
                if txt:
                    extracted_pages.append(txt)
                    
            parsed_text = "\n".join(extracted_pages)
            if not parsed_text.strip():
                raise HTTPException(
                    status_code=400, 
                    detail="The uploaded PDF contains no extractable text. Please ensure it is not a scanned image PDF."
                )
        except HTTPException as he:
            raise he
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to parse PDF: {str(e)}")
            
    elif filename.endswith(".txt"):
        try:
            parsed_text = content.decode("utf-8")
        except UnicodeDecodeError:
            try:
                parsed_text = content.decode("latin-1")
            except Exception:
                raise HTTPException(status_code=400, detail="Failed to decode text file. Ensure it is UTF-8 encoded.")
    else:
        raise HTTPException(status_code=400, detail="Unsupported file format. Please upload a PDF or TXT file.")
        
    resume_text_clean = parsed_text.strip()
    extracted_details = ai_service.extract_resume_details(resume_text_clean)
    
    return {
        "filename": file.filename,
        "resume_text": resume_text_clean,
        "extracted_details": extracted_details
    }

@router.post("/analyze-resume")
async def analyze_resume(file: UploadFile = File(...), current_user: User = Depends(get_current_user)):
    filename = file.filename.lower()
    content = await file.read()
    
    parsed_text = ""
    
    if filename.endswith(".pdf"):
        try:
            pdf_file = io.BytesIO(content)
            pdf_reader = PyPDF2.PdfReader(pdf_file)
            
            extracted_pages = []
            for page in pdf_reader.pages:
                txt = page.extract_text()
                if txt:
                    extracted_pages.append(txt)
                    
            parsed_text = "\n".join(extracted_pages)
            if not parsed_text.strip():
                raise HTTPException(
                    status_code=400, 
                    detail="The uploaded PDF contains no extractable text. Please ensure it is not a scanned image PDF."
                )
        except HTTPException as he:
            raise he
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to parse PDF: {str(e)}")
            
    elif filename.endswith(".txt"):
        try:
            parsed_text = content.decode("utf-8")
        except UnicodeDecodeError:
            try:
                parsed_text = content.decode("latin-1")
            except Exception:
                raise HTTPException(status_code=400, detail="Failed to decode text file. Ensure it is UTF-8 encoded.")
    else:
        raise HTTPException(status_code=400, detail="Unsupported file format. Please upload a PDF or TXT file.")
        
    analysis_data = ai_service.analyze_resume(parsed_text.strip())
    analysis_data["filename"] = file.filename
    return analysis_data

# Request schemas specific to routing input shapes
class NextQuestionRequest(BaseModel):
    session_id: str
    previous_answer: Optional[str] = None

class EvaluateAnswerRequest(BaseModel):
    session_id: str
    question_id: str
    answer: str

class CompleteSessionRequest(BaseModel):
    session_id: str

@router.post("/create-session", response_model=InterviewSession)
async def create_session(config: InterviewConfig, current_user: User = Depends(get_current_user)):
    session_id = str(uuid.uuid4())
    
    # Associate user
    config.user_id = current_user.id
    
    new_session = InterviewSession(
        _id=session_id,
        user_id=current_user.id,
        config=config,
        status=SessionStatus.ACTIVE,
        questions=[],
        answers=[],
        scores=[],
        overall_score=None,
        feedback=None,
        transcript=[],
        created_at=datetime.utcnow(),
        started_at=datetime.utcnow(),
        completed_at=None,
        duration_seconds=None
    )
    
    # Store session in mock database
    fake_sessions_db[session_id] = new_session
    return new_session

@router.post("/next-question")
async def next_question(request: NextQuestionRequest, current_user: User = Depends(get_current_user)):
    session_id = request.session_id
    if session_id not in fake_sessions_db:
        raise HTTPException(status_code=404, detail="Interview session not found")
    
    session: InterviewSession = fake_sessions_db[session_id]
    
    # Generate question using service
    question_text = await ai_service.generate_next_question(session)
    
    # Store the question in session history
    session.questions.append(question_text)
    
    return {
        "question": question_text,
        "question_id": f"q_{len(session.questions)}",
        "session_id": session_id
    }

@router.post("/evaluate-answer", response_model=Answer)
async def evaluate_answer(request: EvaluateAnswerRequest, current_user: User = Depends(get_current_user)):
    session_id = request.session_id
    if session_id not in fake_sessions_db:
        raise HTTPException(status_code=404, detail="Interview session not found")
        
    session: InterviewSession = fake_sessions_db[session_id]
    
    # Identify the corresponding question from the requested index or text
    # Since the frontend does a sequential flow, we can use the latest question in the session list
    if not session.questions:
        raise HTTPException(status_code=400, detail="No question has been asked in this session yet")
        
    current_question = session.questions[-1]
    
    # Call AI service to score and evaluate
    eval_result = await ai_service.evaluate_answer(session, current_question, request.answer)
    
    # Build Answer object
    answer_id = f"a_{uuid.uuid4().hex[:8]}"
    answer_obj = Answer(
        _id=answer_id,
        session_id=session_id,
        question_id=request.question_id,
        answer_text=request.answer,
        audio_path=None,
        technical_score=eval_result.get("technical_score"),
        communication_score=eval_result.get("communication_score"),
        confidence_score=eval_result.get("confidence_score"),
        overall_score=eval_result.get("overall_score"),
        feedback=eval_result.get("feedback"),
        improvements=eval_result.get("improvements", []),
        filler_word_count=eval_result.get("filler_word_count", 0),
        created_at=datetime.utcnow()
    )
    
    # Update session data
    session.answers.append(answer_obj.dict())
    session.scores.append(eval_result.get("overall_score"))
    session.transcript.append({
        "question": current_question,
        "answer": request.answer,
        "score": eval_result.get("overall_score"),
        "feedback": eval_result.get("feedback"),
        "technical_score": eval_result.get("technical_score"),
        "communication_score": eval_result.get("communication_score"),
        "confidence_score": eval_result.get("confidence_score"),
        "strengths": eval_result.get("strengths", []),
        "weaknesses": eval_result.get("weaknesses", []),
        "improvements": eval_result.get("improvements", [])
    })
    
    return answer_obj

@router.post("/complete-session")
async def complete_session(request: CompleteSessionRequest, current_user: User = Depends(get_current_user)):
    session_id = request.session_id
    if session_id not in fake_sessions_db:
        raise HTTPException(status_code=404, detail="Interview session not found")
        
    session: InterviewSession = fake_sessions_db[session_id]
    session.status = SessionStatus.COMPLETED
    session.completed_at = datetime.utcnow()
    
    # Calculate duration
    if session.started_at:
        delta = session.completed_at - session.started_at
        session.duration_seconds = int(delta.total_seconds())
    
    # Generate final overall report
    report_data = await ai_service.generate_final_report(session, session.answers)
    
    session.overall_score = report_data.get("overall_score", 0.0)
    if session.overall_score > 1.0:
        session.overall_score = session.overall_score / 10.0
    session.feedback = report_data.get("strengths", ["Completed"])[0]
    
    # Create final Report object with scores scaled by 10.0
    report_id = f"r_{uuid.uuid4().hex[:8]}"
    report_obj = InterviewReport(
        _id=report_id,
        session_id=session_id,
        user_id=current_user.id,
        overall_score=report_data.get("overall_score", 0.0) * 10.0,
        technical_score=report_data.get("technical_score", 0.0) * 10.0,
        communication_score=report_data.get("communication_score", 0.0) * 10.0,
        confidence_score=report_data.get("confidence_score", 0.0) * 10.0,
        strengths=report_data.get("strengths", []),
        weaknesses=report_data.get("weaknesses", []),
        improvements=report_data.get("improvements", []),
        learning_resources=report_data.get("learning_resources", []),
        roadmap=report_data.get("roadmap", []),
        transcript=session.transcript,
        generated_at=datetime.utcnow()
    )
    
    fake_reports_db[session_id] = report_obj
    
    return {
        "status": "completed",
        "session": session,
        "report_id": report_id
    }

@router.get("/session/{session_id}", response_model=InterviewSession)
async def get_session(session_id: str, current_user: User = Depends(get_current_user)):
    if session_id not in fake_sessions_db:
        raise HTTPException(status_code=404, detail="Interview session not found")
    return fake_sessions_db[session_id]

@router.get("/report/{session_id}", response_model=InterviewReport)
async def get_report(session_id: str, current_user: User = Depends(get_current_user)):
    if session_id not in fake_reports_db:
        # If not completed yet but exists, complete it automatically to avoid errors
        if session_id in fake_sessions_db:
            await complete_session(CompleteSessionRequest(session_id=session_id), current_user)
        else:
            raise HTTPException(status_code=404, detail="Report not found for this session")
            
    return fake_reports_db[session_id]

@router.get("/sessions", response_model=List[InterviewSession])
async def get_sessions(current_user: User = Depends(get_current_user)):
    # Retrieve all sessions associated with this user
    user_sessions = [
        s for s in fake_sessions_db.values()
        if s.user_id == current_user.id
    ]
    # Scale overall_score if it exceeds 1.0 (to fit 0.0 - 1.0 representation for UI lists)
    for s in user_sessions:
        if s.overall_score is not None and s.overall_score > 1.0:
            s.overall_score = s.overall_score / 10.0
            
    # Sort by created date descending
    user_sessions.sort(key=lambda x: x.created_at or datetime.min, reverse=True)
    return user_sessions

@router.get("/analytics")
async def get_analytics(current_user: User = Depends(get_current_user)):
    user_reports = [
        r for r in fake_reports_db.values()
        if r.user_id == current_user.id
    ]
    # Sort by generated_at ascending to build timeline
    user_reports.sort(key=lambda x: x.generated_at or datetime.min)
    
    total_interviews = len(user_reports)
    
    if total_interviews == 0:
        return {
            "total_interviews": 0,
            "average_score": 0.0,
            "technical_avg": 0.0,
            "communication_avg": 0.0,
            "confidence_avg": 0.0,
            "practice_streak": 0,
            "total_practice_minutes": 0,
            "score_trend": [],
            "skill_radar": [
                {"subject": "Technical", "A": 0},
                {"subject": "Communication", "A": 0},
                {"subject": "Confidence", "A": 0},
                {"subject": "Problem Solving", "A": 0},
                {"subject": "Leadership", "A": 0}
            ],
            "badges": [],
            "recommended_topics": ["Core Technical Interview", "System Design Basics", "Behavioral STAR Method"]
        }
        
    avg_score = sum(r.overall_score for r in user_reports) / total_interviews
    avg_tech = sum(r.technical_score for r in user_reports) / total_interviews
    avg_comm = sum(r.communication_score for r in user_reports) / total_interviews
    avg_conf = sum(r.confidence_score for r in user_reports) / total_interviews
    
    # Calculate streak
    unique_dates = sorted(list({r.generated_at.date() for r in user_reports}), reverse=True)
    streak = 0
    if unique_dates:
        from datetime import date, timedelta
        today = datetime.utcnow().date()
        if unique_dates[0] == today or unique_dates[0] == today - timedelta(days=1):
            streak = 1
            current_date = unique_dates[0]
            for next_date in unique_dates[1:]:
                if current_date - next_date == timedelta(days=1):
                    streak += 1
                    current_date = next_date
                elif current_date - next_date == timedelta(days=0):
                    continue
                else:
                    break
                    
    # Total minutes
    total_minutes = 0
    for r in user_reports:
        s = fake_sessions_db.get(r.session_id)
        if s and s.duration_seconds:
            total_minutes += s.duration_seconds // 60
        else:
            total_minutes += 25  # default estimate
            
    # Trend
    score_trend = []
    for r in user_reports:
        date_str = r.generated_at.strftime("%b %d")
        score_trend.append({
            "date": date_str,
            "score": round(r.overall_score, 1)
        })
        
    # Radar
    skill_radar = [
        {"subject": "Technical", "A": round(avg_tech, 1)},
        {"subject": "Communication", "A": round(avg_comm, 1)},
        {"subject": "Confidence", "A": round(avg_conf, 1)},
        {"subject": "Problem Solving", "A": round((avg_tech + avg_comm) / 2, 1)},
        {"subject": "Leadership", "A": round(avg_comm if avg_comm > 50 else 50, 1)}
    ]
    
    # Badges
    badges = []
    if total_interviews >= 1:
        badges.append({
            "id": "first_interview",
            "name": "First Steps",
            "description": "Completed your first interview session",
            "icon": "Play"
        })
    if total_interviews >= 5:
        badges.append({
            "id": "marathoner",
            "name": "Marathoner",
            "description": "Completed 5 or more interview sessions",
            "icon": "Award"
        })
    
    has_tech_excellence = any(r.overall_score >= 80.0 for r in user_reports)
    if has_tech_excellence:
        badges.append({
            "id": "tech_excellence",
            "name": "Technical Excellence",
            "description": "Scored 80% or above in any session",
            "icon": "Brain"
        })
        
    has_comm_master = any(r.communication_score >= 85.0 for r in user_reports)
    if has_comm_master:
        badges.append({
            "id": "comm_master",
            "name": "Communication Master",
            "description": "Scored 85% or above in communication",
            "icon": "Zap"
        })
        
    if streak >= 3:
        badges.append({
            "id": "streak_master",
            "name": "Dedication",
            "description": "Maintained a practice streak of 3+ days",
            "icon": "TrendingUp"
        })
        
    # Recommended Topics
    practiced_types = set()
    for r in user_reports:
        s = fake_sessions_db.get(r.session_id)
        if s:
            practiced_types.add(s.config.interview_type.value)
            
    recommended_topics = []
    if "technical" not in practiced_types:
        recommended_topics.append("Core Technical Interview")
    if "system_design" not in practiced_types:
        recommended_topics.append("System Design Basics")
    if "behavioral" not in practiced_types:
        recommended_topics.append("Behavioral STAR Method")
    if "hr" not in practiced_types:
        recommended_topics.append("HR Cultural Fit")
        
    if not recommended_topics:
        # Find lowest average
        avgs = {
            "Technical Skills": avg_tech,
            "Communication Structure": avg_comm,
            "Confidence & Pacing": avg_conf
        }
        lowest_cat = min(avgs, key=avgs.get)
        recommended_topics.append(f"Improve {lowest_cat}")
        recommended_topics.append("Advanced System Design")
        
    while len(recommended_topics) < 3:
        recommended_topics.append("Random Coding Mock")
        
    return {
        "total_interviews": total_interviews,
        "average_score": round(avg_score, 1),
        "technical_avg": round(avg_tech, 1),
        "communication_avg": round(avg_comm, 1),
        "confidence_avg": round(avg_conf, 1),
        "practice_streak": streak,
        "total_practice_minutes": total_minutes,
        "score_trend": score_trend,
        "skill_radar": skill_radar,
        "badges": badges,
        "recommended_topics": recommended_topics
    }
