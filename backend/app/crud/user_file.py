"""
CRUD para Ficheiro de Utilizador (UserFile)
-------------------------------------------
Operações de base de dados para a entidade UserFile.
Nota: A lógica de upload/download de ficheiros físicos fica no router.
"""

from typing import List, Optional
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.crud.base import CRUDBase
from app.models.user_files import UserFile
from app.schemas.user_file import UserFileCreate


# Schema de update vazio (não há endpoint de update para ficheiros)
class UserFileUpdate(BaseModel):
    pass


class CRUDUserFile(CRUDBase[UserFile, UserFileCreate, UserFileUpdate]):
    """
    CRUD para UserFile.
    Herda operações básicas e adiciona métodos específicos.
    """

    def get_by_user(
        self, db: Session, *, user_id: int
    ) -> List[UserFile]:
        """
        Lista ficheiros de um utilizador específico.
        """
        return (
            db.query(self.model)
            .filter(self.model.user_id == user_id)
            .all()
        )

    def get_by_user_and_id(
        self, db: Session, *, user_id: int, file_id: int
    ) -> Optional[UserFile]:
        """
        Obtém um ficheiro específico de um utilizador.
        """
        return (
            db.query(self.model)
            .filter(
                self.model.id == file_id,
                self.model.user_id == user_id,
            )
            .first()
        )

    def create_for_user(
        self,
        db: Session,
        *,
        user_id: int,
        filename: str,
        file_path: str,
        file_type: Optional[str] = None
    ) -> UserFile:
        """
        Cria um registo de ficheiro para um utilizador.
        """
        db_obj = self.model(
            user_id=user_id,
            filename=filename,
            file_path=file_path,
            file_type=file_type,
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj


# Instância singleton para uso nos routers
user_file = CRUDUserFile(UserFile)
