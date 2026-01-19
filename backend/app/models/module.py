"""
Modelo de Módulo (Module)
-------------------------
Representa uma Unidade Curricular ou Módulo de Formação (ex: "Bases de Dados", "Inglês Técnico").
Esta é a definição abstrata do módulo (o "template"), não a sua ocorrência num curso específico.

Funcionalidades:
- Nome e Área de formação.
- Duração padrão (horas) que serve de base para o planeamento.
"""

from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.db.base import Base


class Module(Base):

    __tablename__ = "modules"

    # Identificação
    id = Column(Integer, primary_key=True, index=True)
    name = Column(
        String, index=True, nullable=False, doc="Nome do módulo (ex: 'Algoritmos')"
    )
    area = Column(
        String, nullable=True, doc="Área a que pertence (ex: 'Informática', 'Gestão')"
    )

    # Detalhes Pedagógicos
    default_duration_hours = Column(
        Integer, default=25, doc="Duração padrão em horas (sugestão ao criar curso)"
    )

    # RELACIONAMENTOS

    # 1. Ocorrências deste módulo em cursos
    # Um módulo pode ser dado em vários cursos diferentes (Muitos-para-Muitos via CourseModule)
    course_modules = relationship("CourseModule", back_populates="module")
