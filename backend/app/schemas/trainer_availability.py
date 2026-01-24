from typing import Optional
from datetime import time, date
from pydantic import BaseModel


# Base Schema
class TrainerAvailabilityBase(BaseModel):
    day_of_week: Optional[int] = (
        None
    )

    start_time: time
    end_time: time
    is_recurring: bool = True
    specific_date: Optional[date] = None


# Create Schema
class TrainerAvailabilityCreate(TrainerAvailabilityBase):
    pass


# Update Schema
class TrainerAvailabilityUpdate(BaseModel):
    day_of_week: Optional[int] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    is_recurring: Optional[bool] = None
    specific_date: Optional[date] = None


# Response Schema
class TrainerAvailability(TrainerAvailabilityBase):
    id: int
    trainer_id: int

    class Config:
        from_attributes = True
