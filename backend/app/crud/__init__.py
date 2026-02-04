"""
Módulo CRUD
-----------
Exporta todas as instâncias CRUD para uso nos routers.

Uso:
    from app.crud import classroom, module, course, enrollment

    # Listar salas
    classrooms = classroom.get_multi(db)

    # Criar módulo
    new_module = module.create(db, obj_in=module_data)

    # Verificar inscrição existente
    existing = enrollment.get_by_user_and_course(db, user_id=1, course_id=1)
"""

from app.crud.classroom import classroom
from app.crud.module import module
from app.crud.course import course
from app.crud.enrollment import enrollment
from app.crud.course_module import course_module
from app.crud.lesson import lesson
from app.crud.module_grade import module_grade
from app.crud.trainer_availability import trainer_availability
from app.crud.user_file import user_file
from app.crud.chat_log import chat_log

# User CRUD mantém a API original (funções, não classe)
# Para consistência futura, pode ser migrado para o padrão de classe
from app.crud import user

__all__ = [
    "classroom",
    "module",
    "course",
    "enrollment",
    "course_module",
    "lesson",
    "module_grade",
    "trainer_availability",
    "user_file",
    "chat_log",
    "user",
]
