"""
Classe Base Genérica para Operações CRUD
-----------------------------------------
Fornece operações básicas de Create, Read, Update, Delete
que podem ser herdadas por CRUDs específicos de cada entidade.

Uso:
    class CRUDClassroom(CRUDBase[Classroom, ClassroomCreate, ClassroomUpdate]):
        pass

    classroom = CRUDClassroom(Classroom)
"""

from typing import Any, Generic, List, Optional, Type, TypeVar, Union

from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.base import Base

# Type variables para generics
ModelType = TypeVar("ModelType", bound=Base)
CreateSchemaType = TypeVar("CreateSchemaType", bound=BaseModel)
UpdateSchemaType = TypeVar("UpdateSchemaType", bound=BaseModel)


class CRUDBase(Generic[ModelType, CreateSchemaType, UpdateSchemaType]):
    """
    Classe base com operações CRUD genéricas.

    Parâmetros de tipo:
        ModelType: Modelo SQLAlchemy (ex: Classroom)
        CreateSchemaType: Schema Pydantic para criação (ex: ClassroomCreate)
        UpdateSchemaType: Schema Pydantic para atualização (ex: ClassroomUpdate)
    """

    def __init__(self, model: Type[ModelType]):
        """
        Args:
            model: Classe do modelo SQLAlchemy
        """
        self.model = model

    def get(self, db: Session, id: Any) -> Optional[ModelType]:
        """
        Obtém um registo pelo ID.
        """
        return db.query(self.model).filter(self.model.id == id).first()

    def get_multi(
        self, db: Session, *, skip: int = 0, limit: int = 100
    ) -> List[ModelType]:
        """
        Lista múltiplos registos com paginação.
        """
        return db.query(self.model).offset(skip).limit(limit).all()

    def create(self, db: Session, *, obj_in: CreateSchemaType) -> ModelType:
        """
        Cria um novo registo.
        """
        obj_in_data = obj_in.model_dump()
        db_obj = self.model(**obj_in_data)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(
        self,
        db: Session,
        *,
        db_obj: ModelType,
        obj_in: Union[UpdateSchemaType, dict[str, Any]]
    ) -> ModelType:
        """
        Atualiza um registo existente.
        """
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.model_dump(exclude_unset=True)

        for field, value in update_data.items():
            setattr(db_obj, field, value)

        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def remove(self, db: Session, *, id: int) -> Optional[ModelType]:
        """
        Remove um registo pelo ID.
        """
        obj = db.query(self.model).filter(self.model.id == id).first()
        if obj:
            db.delete(obj)
            db.commit()
        return obj
