from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate
from app.core.security import get_password_hash
from typing import Union


def get_user_by_email(db: Session, email: str):
    """
    Busca um utilizador pelo email.
    """
    return db.query(User).filter(User.email == email).first()


def create_user(db: Session, user: UserCreate):
    """
    Cria um novo utilizador na base de dados.
    A password é automaticamente encriptada antes de ser guardada.
    """
    hashed_password = get_password_hash(user.password)
    db_user = User(
        email=user.email,
        hashed_password=hashed_password,
        full_name=user.full_name,
        role=user.role,
        is_active=user.is_active,
        is_superuser=user.is_superuser,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def get_user(db: Session, user_id: int):
    return db.query(User).filter(User.id == user_id).first()


def get_users(db: Session, skip: int = 0, limit: int = 100):
    return db.query(User).offset(skip).limit(limit).all()


def update_user(db: Session, db_user: User, user_in: Union[UserCreate, UserUpdate]):
    # Converte Pydantic model para dict, excluindo valores nulos
    update_data = user_in.dict(exclude_unset=True)

    # Se houver password, faz hash antes de atualizar
    if "password" in update_data:
        hashed_password = get_password_hash(update_data["password"])
        del update_data["password"]
        db_user.hashed_password = hashed_password

    # Atualiza os campos
    for field, value in update_data.items():
        setattr(db_user, field, value)

    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def delete_user(db: Session, user_id: int):
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        db.delete(user)
        db.commit()
    return user
