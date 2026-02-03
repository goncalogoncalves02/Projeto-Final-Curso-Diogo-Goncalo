"""
CRUD para Sala (Classroom)
--------------------------
Operações de base de dados para a entidade Classroom.
"""

from app.crud.base import CRUDBase
from app.models.classroom import Classroom
from app.schemas.classroom import ClassroomCreate, ClassroomUpdate


class CRUDClassroom(CRUDBase[Classroom, ClassroomCreate, ClassroomUpdate]):
    """
    CRUD para Classroom.
    Herda todas as operações básicas de CRUDBase.
    Pode ser estendido com métodos específicos se necessário.
    """

    pass


# Instância singleton para uso nos routers
classroom = CRUDClassroom(Classroom)
