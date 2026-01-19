"""
Modelo de Ficheiro de Utilizador (UserFile)
-------------------------------------------
Permite associar ficheiros arbitrários a um utilizador.
Útil para guardar Curriculums, Fichas de Inscrição, Fotos, Comprovativos, etc.

Funcionalidades:
- Registo do caminho físico do ficheiro.
- Metadados (tipo, nome original).
"""

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base


class UserFile(Base):
    
    __tablename__ = "user_files"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(
        Integer, ForeignKey("users.id"), nullable=False, doc="Dono do ficheiro"
    )

    # Metadados do Ficheiro
    filename = Column(
        String, nullable=False, doc="Nome original do ficheiro (ex: 'cv_joao.pdf')"
    )
    file_path = Column(
        String, nullable=False, doc="Caminho relativo ou URL onde está guardado"
    )
    file_type = Column(
        String, nullable=True, doc="Extensão ou tipo MIME (ex: 'pdf', 'image/png')"
    )

    uploaded_at = Column(DateTime, default=func.now(), doc="Data de upload")

    # RELACIONAMENTOS

    # 1. Utilizador proprietário
    user = relationship("User", back_populates="files")
