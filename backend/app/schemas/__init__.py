from .token import Token, TokenData
from .user import User, UserCreate, UserUpdate, UserLogin
from .module import Module, ModuleCreate, ModuleUpdate
from .course import Course, CourseCreate, CourseUpdate
from .classroom import Classroom, ClassroomCreate, ClassroomUpdate
from .trainer_availability import (
    TrainerAvailability,
    TrainerAvailabilityCreate,
    TrainerAvailabilityUpdate,
)
from .enrollment import Enrollment, EnrollmentCreate, EnrollmentUpdate
from .module_grade import ModuleGrade, ModuleGradeCreate, ModuleGradeUpdate
from .course_module import CourseModule, CourseModuleCreate, CourseModuleUpdate
from .lesson import (
    Lesson,
    LessonCreate,
    LessonUpdate,
    LessonWithDetails,
    LessonConflictError,
    LessonHoursInfo,
    LessonCreateResponse,
)
