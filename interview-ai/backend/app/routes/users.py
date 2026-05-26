from datetime import datetime
from typing import List, Dict
from fastapi import APIRouter, HTTPException, Depends, status

from app.models import User, UserUpdate, PerformanceMetrics
from app.routes.auth import get_current_user, fake_users_db
from app.utils.db import fake_reports_db, fake_sessions_db

router = APIRouter()

@router.get("/profile", response_model=User)
async def get_profile(current_user: User = Depends(get_current_user)):
    user_record = fake_users_db.get(current_user.email)
    if not user_record:
        raise HTTPException(status_code=404, detail="User profile not found")
        
    return User(
        id=current_user.email,
        email=current_user.email,
        full_name=user_record.get("full_name"),
        bio=user_record.get("bio"),
        skills=user_record.get("skills", []),
        target_role=user_record.get("target_role")
    )

@router.put("/profile", response_model=User)
async def update_profile(updates: UserUpdate, current_user: User = Depends(get_current_user)):
    user_record = fake_users_db.get(current_user.email)
    if not user_record:
        raise HTTPException(status_code=404, detail="User profile not found")
        
    # Update fields if provided
    if updates.full_name is not None:
        user_record["full_name"] = updates.full_name
    if updates.bio is not None:
        user_record["bio"] = updates.bio
    if updates.skills is not None:
        user_record["skills"] = updates.skills
    if updates.target_role is not None:
        user_record["target_role"] = updates.target_role
        
    user_record["updated_at"] = datetime.utcnow()
    
    return User(
        id=current_user.email,
        email=current_user.email,
        full_name=user_record.get("full_name"),
        bio=user_record.get("bio"),
        skills=user_record.get("skills", []),
        target_role=user_record.get("target_role")
    )

@router.get("/analytics", response_model=PerformanceMetrics)
async def get_analytics(current_user: User = Depends(get_current_user)):
    # Find all completed sessions and reports for the user
    user_reports = [
        r for r in fake_reports_db.values()
        if r.user_id == current_user.id
    ]
    
    total_count = len(user_reports)
    
    if total_count == 0:
        # Return empty default analytics
        return PerformanceMetrics(
            total_interviews=0,
            average_score=0.0,
            technical_avg=0.0,
            communication_avg=0.0,
            confidence_avg=0.0,
            improvement_trend=[],
            topic_strengths={},
            topic_weaknesses={},
            last_updated=datetime.utcnow()
        )
        
    # Calculate aggregate averages
    avg_overall = round(sum(r.overall_score for r in user_reports) / total_count, 1)
    avg_tech = round(sum(r.technical_score for r in user_reports) / total_count, 1)
    avg_comm = round(sum(r.communication_score for r in user_reports) / total_count, 1)
    avg_conf = round(sum(r.confidence_score for r in user_reports) / total_count, 1)
    
    # Calculate historical trend (scores sorted by generation date ascending)
    sorted_reports = sorted(user_reports, key=lambda x: x.generated_at or datetime.min)
    trend = [float(r.overall_score) for r in sorted_reports]
    
    # Compile topic strengths & weaknesses counters
    strengths_map = {}
    weaknesses_map = {}
    
    for r in user_reports:
        for str_item in r.strengths:
            # Group or tally frequency of mentions
            strengths_map[str_item] = strengths_map.get(str_item, 0) + 1
        for weak_item in r.weaknesses:
            weaknesses_map[weak_item] = weaknesses_map.get(weak_item, 0) + 1
            
    return PerformanceMetrics(
        total_interviews=total_count,
        average_score=avg_overall,
        technical_avg=avg_tech,
        communication_avg=avg_comm,
        confidence_avg=avg_conf,
        improvement_trend=trend,
        topic_strengths=strengths_map,
        topic_weaknesses=weaknesses_map,
        last_updated=datetime.utcnow()
    )
