from typing import Optional
from datetime import date
from pydantic import BaseModel
from app.models.enrollment import EnrollmentStatus
from app.schemas.user import User  # To return user details
from app.schemas.course import Course  # To return course details


# Base Schema
class EnrollmentBase(BaseModel):
    user_id: int
    course_id: int
    enrollment_date: date
    status: EnrollmentStatus = EnrollmentStatus.active
    final_grade: Optional[int] = None
    final_certificate_url: Optional[str] = None


# Create Schema
class EnrollmentCreate(EnrollmentBase):
    pass


# Update Schema
class EnrollmentUpdate(BaseModel):
    status: Optional[EnrollmentStatus] = None
    final_grade: Optional[int] = None
    final_certificate_url: Optional[str] = None


# Response Schema
class Enrollment(EnrollmentBase):
    id: int
    user: Optional[User] = None  # Include user details in response

    class Config:
        from_attributes = True
