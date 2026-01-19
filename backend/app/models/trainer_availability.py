from sqlalchemy import Column, Integer, Time, Boolean, Date, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base


class TrainerAvailability(Base):
    """
    Define a disponibilidade de um formador para dar aulas.
    """

    __tablename__ = "trainer_availability"

    id = Column(Integer, primary_key=True, index=True)
    trainer_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # 1=Domingo, 2=Segunda, ..., 7=Sábado
    day_of_week = Column(Integer, nullable=True)

    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)

    is_recurring = Column(Boolean, default=True)
    specific_date = Column(Date, nullable=True)  # Se não for recorrente

    # Relacionamentos
    trainer = relationship("User", back_populates="availabilities")
