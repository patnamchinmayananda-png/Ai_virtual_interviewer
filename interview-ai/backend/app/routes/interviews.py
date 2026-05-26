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
        
    return {
        "filename": file.filename,
        "resume_text": parsed_text.strip()
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
        "feedback": eval_result.get("feedback")
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
    session.feedback = report_data.get("strengths", ["Completed"])[0]
    
    # Create final Report object
    report_id = f"r_{uuid.uuid4().hex[:8]}"
    report_obj = InterviewReport(
        _id=report_id,
        session_id=session_id,
        user_id=current_user.id,
        overall_score=report_data.get("overall_score", 0.0),
        technical_score=report_data.get("technical_score", 0.0),
        communication_score=report_data.get("communication_score", 0.0),
        confidence_score=report_data.get("confidence_score", 0.0),
        strengths=report_data.get("strengths", []),
        weaknesses=report_data.get("weaknesses", []),
        improvements=report_data.get("improvements", []),
        learning_resources=report_data.get("learning_resources", []),
        transcript=session.transcript,
        generated_at=datetime.utcnow()
    )
    
    fake_reports_db[session_id] = report_obj
    
    return {
        "status": "completed",
        "session": session,
        "report_id": report_id
    }

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
    # Sort by created date descending
    user_sessions.sort(key=lambda x: x.created_at or datetime.min, reverse=True)
    return user_sessions
