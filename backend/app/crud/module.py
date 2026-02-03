"""
CRUD para Módulo (Module)
-------------------------
Operações de base de dados para a entidade Module.
"""

from app.crud.base import CRUDBase
from app.models.module import Module
from app.schemas.module import ModuleCreate, ModuleUpdate


class CRUDModule(CRUDBase[Module, ModuleCreate, ModuleUpdate]):
    """
    CRUD para Module.
    Herda todas as operações básicas de CRUDBase.
    Pode ser estendido com métodos específicos se necessário.
    """

    pass


# Instância singleton para uso nos routers
module = CRUDModule(Module)
