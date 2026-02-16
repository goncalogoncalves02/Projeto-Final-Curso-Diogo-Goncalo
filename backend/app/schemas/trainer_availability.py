from typing import Optional
from datetime import time, date
from pydantic import BaseModel, model_validator


# Base Schema
class TrainerAvailabilityBase(BaseModel):
    day_of_week: Optional[int] = None
    start_time: time
    end_time: time
    is_recurring: bool = True
    specific_date: Optional[date] = None


# Create Schema
class TrainerAvailabilityCreate(TrainerAvailabilityBase):
    @model_validator(mode="after")
    def validate_availability(self):
        if self.end_time <= self.start_time:
            raise ValueError("A hora de fim deve ser posterior à hora de início")
        if self.is_recurring:
            if self.day_of_week is None or not (1 <= self.day_of_week <= 7):
                raise ValueError("Dia da semana deve estar entre 1 (Domingo) e 7 (Sábado)")
        else:
            if self.specific_date is None:
                raise ValueError("Data específica é obrigatória para disponibilidade não recorrente")
        return self


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
