"""
Modelo de Disponibilidade de Professor (TrainerAvailability)
-----------------------------------------------------------
Define as janelas temporais em que um professor pode lecionar.
Crucial para o algoritmo de geração automática de horários.

Pode definir:
1. Padrões Recorrentes (ex: "Todas as Segundas das 09:00 às 13:00")
2. Exceções ou dias específicos (ex: "No dia 25/12 estou indisponível") - Embora a lógica aqui pareça ser positiva (disponibilidade)
"""

from sqlalchemy import Column, Integer, Time, Boolean, Date, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base


class TrainerAvailability(Base):

    __tablename__ = "trainer_availability"

    id = Column(Integer, primary_key=True, index=True)
    trainer_id = Column(Integer, ForeignKey("users.id"), nullable=False, doc="Professor")

    # Definição Temporal
    day_of_week = Column(
        Integer, nullable=True, doc="Dia da semana (1=Domingo, 2=Segunda ... 7=Sábado)"
    )
    start_time = Column(Time, nullable=False, doc="Hora de início da disponibilidade")
    end_time = Column(Time, nullable=False, doc="Hora de fim da disponibilidade")

    # Recorrência vs Data Específica
    is_recurring = Column(
        Boolean, default=True, doc="Se True, aplica-se a todas as semanas naquele dia"
    )
    specific_date = Column(
        Date,
        nullable=True,
        doc="Se preenchido, aplica-se apenas a esta data (ignora dia da semana)",
    )

    # RELACIONAMENTOS

    # 1. Professor
    trainer = relationship("User", back_populates="availabilities")
