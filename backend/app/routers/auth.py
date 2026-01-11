from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Request
from fastapi.responses import RedirectResponse
from fastapi.security import OAuth2PasswordRequestForm
from authlib.integrations.starlette_client import OAuth
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from app.core import security, email
from app.core.config import settings
from app.api import deps
from app.schemas import user as user_schema, token as token_schema
from app.crud import user as user_crud
from fastapi.responses import JSONResponse

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=user_schema.User)
async def register_user(
    user_in: user_schema.UserCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(deps.get_db),
):
    """
    Registo de novo utilizador. Envia email de verificação.
    """
    # Verificar se email existe
    user = user_crud.get_user_by_email(db, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=400, detail="Este email já se encontra registado."
        )

    # Criar utilizador
    user = user_crud.create_user(db, user=user_in)

    # Gerar token de verificação (válido por 24h)
    verification_token = security.create_access_token(
        subject=user.email,
        expires_delta=timedelta(hours=24),
        data={"type": "email_confirmation"},
    )

    # Enviar email em background (não bloqueia a resposta)
    background_tasks.add_task(
        email.send_verification_email, email_to=user.email, token=verification_token
    )

    return user


@router.post("/verify-email")
def verify_email(token: str, db: Session = Depends(deps.get_db)):
    """
    Valida o token do email e ativa a conta.
    """
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        email: str = payload.get("sub")
        token_type: str = payload.get("type")

        if email is None or token_type != "email_confirmation":
            raise HTTPException(status_code=400, detail="Token inválido")

    except JWTError:
        raise HTTPException(status_code=400, detail="Token inválido ou expirado")

    # Ativar utilizador
    user = user_crud.get_user_by_email(db, email=email)
    if not user:
        raise HTTPException(status_code=404, detail="Utilizador não encontrado")

    if user.is_active:
        return {"message": "Conta já ativada"}

    user.is_active = True
    db.add(user)
    db.commit()

    return {"message": "Conta ativada com sucesso"}


@router.post("/login", response_model=token_schema.Token)
async def login_for_access_token(
    background_tasks: BackgroundTasks,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(deps.get_db),
):
    """
    Login para obter token de acesso (OAuth2).
    """
    # Autenticar utilizador
    user = user_crud.get_user_by_email(db, email=form_data.username)
    if not user or not security.verify_password(
        form_data.password, user.hashed_password
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou password incorretos",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Verificar 2FA
    if user.is_2fa_enabled:
        # Gerar código de 6 dígitos
        import secrets

        code = "".join([str(secrets.randbelow(10)) for _ in range(6)])

        # Guardar na BD (Expira em 5 min)
        from datetime import datetime

        user.otp_code = code
        # Guardar timestamp string ISO
        user.otp_expires_at = (datetime.utcnow() + timedelta(minutes=5)).isoformat()
        db.add(user)
        db.commit()

        # Enviar Email
        background_tasks.add_task(email.send_2fa_email, email_to=user.email, code=code)

        # Retornar 202 com indicação que precisa de código
        # Nota: Usamos JSONResponse para garantir que as background tasks são executadas.
        # Ao levantar HTTPException, o fluxo é interrompido e tasks podem não correr.

        return JSONResponse(
            status_code=202,
            content={
                "2fa_required": True,
                "email": user.email,
                "message": "Email enviado com código 2FA",
            },
        )

    # Criar Token JWT (Login normal)
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        subject=user.email, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


class Login2FARequest(user_schema.BaseModel):
    email: user_schema.EmailStr
    code: str


@router.post("/login/2fa", response_model=token_schema.Token)
def login_2fa(data: Login2FARequest, db: Session = Depends(deps.get_db)):
    """
    Valida código 2FA e retorna token.
    """
    user = user_crud.get_user_by_email(db, email=data.email)
    if not user:
        raise HTTPException(status_code=404, detail="Utilizador não encontrado")

    # Verificar validade do código
    from datetime import datetime

    if not user.otp_code or user.otp_code != data.code:
        raise HTTPException(status_code=400, detail="Código inválido")

    if not user.otp_expires_at or datetime.utcnow() > datetime.fromisoformat(
        user.otp_expires_at
    ):
        raise HTTPException(status_code=400, detail="Código expirado")

    # Limpar código usado
    user.otp_code = None
    user.otp_expires_at = None
    db.add(user)
    db.commit()

    # Criar Token JWT
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        subject=user.email, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=user_schema.User)
def read_users_me(current_user: user_schema.User = Depends(deps.get_current_user)):
    """
    Retorna o perfil do utilizador logado.
    """
    return current_user


class PasswordResetRequest(user_schema.BaseModel):
    email: user_schema.EmailStr


class PasswordResetConfirm(user_schema.BaseModel):
    token: str
    new_password: str


@router.post("/forgot-password")
async def forgot_password(
    request: PasswordResetRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(deps.get_db),
):
    """
    Envia email com token para redefinir password.
    """
    user = user_crud.get_user_by_email(db, email=request.email)
    if user:
        # Gerar token válido por 1 hora
        reset_token = security.create_access_token(
            subject=user.email,
            expires_delta=timedelta(hours=1),
            data={"type": "password_reset"},
        )

        background_tasks.add_task(
            email.send_reset_password_email, email_to=user.email, token=reset_token
        )

    # Retornamos sempre sucesso para não revelar se o email existe ou não (segurança)
    return {
        "message": "Se o email existir, receberás instruções para redefinir a password."
    }


@router.post("/reset-password")
def reset_password(data: PasswordResetConfirm, db: Session = Depends(deps.get_db)):
    """
    Redefine a password usando o token recebido por email.
    """
    try:
        payload = jwt.decode(
            data.token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        email: str = payload.get("sub")
        token_type: str = payload.get("type")

        if email is None or token_type != "password_reset":
            raise HTTPException(status_code=400, detail="Token inválido")

    except JWTError:
        raise HTTPException(status_code=400, detail="Token inválido ou expirado")

    user = user_crud.get_user_by_email(db, email=email)
    if not user:
        raise HTTPException(status_code=404, detail="Utilizador não encontrado")

    # Atualizar password
    user.hashed_password = security.get_password_hash(data.new_password)
    db.add(user)
    db.commit()

    return {"message": "Password alterada com sucesso."}


# Configuração OAuth
oauth = OAuth()
oauth.register(
    name="google",
    client_id=settings.GOOGLE_CLIENT_ID,
    client_secret=settings.GOOGLE_CLIENT_SECRET,
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={"scope": "openid email profile"},
)


@router.get("/google/login")
async def login_via_google(request: Request):
    """
    Redireciona o utilizador para a página de login do Google.
    """
    redirect_uri = request.url_for("auth_google_callback")
    return await oauth.google.authorize_redirect(request, redirect_uri)


@router.get("/google/callback")
async def auth_google_callback(request: Request, db: Session = Depends(deps.get_db)):
    """
    Callback chamado pelo Google após login.
    """
    try:
        token = await oauth.google.authorize_access_token(request)
        user_info = token.get("userinfo")
        if not user_info:
            # Tentar obter userinfo explicitamente se não vier no token
            user_info = await oauth.google.userinfo(token=token)
    except Exception as e:
        raise HTTPException(
            status_code=400, detail=f"Erro na autenticação Google: {str(e)}"
        )

    email = user_info.get("email")
    name = user_info.get("name")

    if not email:
        raise HTTPException(status_code=400, detail="Email não fornecido pelo Google")

    # Verificar se utilizador existe
    user = user_crud.get_user_by_email(db, email=email)

    if not user:
        # Criar novo utilizador automaticamente
        user_in = user_schema.UserCreate(
            email=email,
            full_name=name,
            password=security.get_password_hash(
                "GOOGLE_OAUTH_RANDOM_" + security.create_access_token(email)
            ),  # Senha aleatória
            role="estudante",  # Default role
            is_active=True,  # Google emails are verified
        )
        # Nota: Ajustamos o UserCreate schema para aceitar password ignorada ou usamos create_user manual
        # Vamos fazer manual aqui para ser mais rápido e evitar validações de schema da API
        user = user_crud.User(
            email=email,
            hashed_password=user_in.password,
            full_name=name,
            role="estudante",
            is_active=True,
            is_superuser=False,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    # Gerar Token JWT
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        subject=user.email, expires_delta=access_token_expires
    )

    # Redirecionar para o Frontend com o token na URL
    # O Frontend vai ler o token da URL e guardar no LocalStorage
    return RedirectResponse(
        url=f"http://localhost:5173/social-callback?token={access_token}"
    )
