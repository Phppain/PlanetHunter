# app/main.py
from fastapi import FastAPI, UploadFile, File, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
import pandas as pd
import numpy as np
import shap
import joblib
import io
import asyncio

from . import models, crud, schemas, auth
from .database import engine, Base, SessionLocal

# создаём таблицы
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Exoplanet Detector API", description="AI модель для поиска экзопланет", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# загружаем модель один раз
import os, joblib

model_path = os.path.join(os.path.dirname(__file__), "model.pkl")
model = joblib.load(model_path)
# auth endpoints
@app.post("/auth/register", response_model=dict)
def register(user: schemas.UserCreate, db: Session = Depends(auth.get_db)):
    existing = crud.get_user_by_username(db, user.username)
    if existing:
        raise HTTPException(status_code=400, detail="Пользователь с таким именем уже существует")
    crud.create_user(db, user.username, user.password)
    return {"status": "ok", "msg": "Пользователь создан"}

@app.post("/auth/token", response_model=schemas.Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(auth.get_db)):
    user = crud.get_user_by_username(db, form_data.username)
    if not user or not crud.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверное имя пользователя или пароль",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

# helper to get db in endpoints
def get_db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/")
def root():
    return {"message": "API работает. Зарегистрируйтесь и залогиньтесь для использования /analyze/"}

from datetime import timedelta
@app.post("/analyze/")
async def analyze(
    file: UploadFile = File(...),
    current_user: models.User = Depends(auth.get_current_user)
):
    try:
        # --- 1. Читаем CSV из UploadFile ---
        contents = await file.read()
        df_test = pd.read_csv(io.BytesIO(contents), comment="#", sep=",", low_memory=False)

        if len(df_test.columns) == 0:
            raise HTTPException(status_code=400, detail="Файл пустой или не содержит данных.")

        # --- 2. Загружаем оригинальный датасет, чтобы взять kepid при необходимости ---
        original_path = os.path.join(os.path.dirname(__file__), "cumulative_2025.10.03_23.57.10.csv")
        df_original = pd.read_csv(original_path, comment="#", sep=",", low_memory=False)

        # --- 3. Находим колонку kepid ---
        id_col = None
        for c in df_original.columns:
            if "kepid" in c.lower():
                id_col = c
                break

        if not id_col:
            raise HTTPException(status_code=400, detail="В исходных данных не найдено поле kepid.")

        # --- 4. Добавляем колонку kepid, если её нет ---
        if id_col not in df_test.columns:
            df_test[id_col] = df_original.loc[df_test.index, id_col].values

        total_objects = len(df_test)

        # --- 5. Загружаем модель ---
        model_path = os.path.join(os.path.dirname(__file__), "model.pkl")
        model = joblib.load(model_path)

        # --- 6. Берём фичи и делаем предсказание ---
        train_features = model.feature_name()
        X_test = df_test[train_features]
        df_test["procent"] = model.predict(X_test)

        # --- 7. Фильтруем только вероятные планеты ---
        filtered = df_test[df_test["procent"] > 0.5].copy()

        # --- 8. SHAP-анализ ---
        explainer = shap.TreeExplainer(model)
        shap_values = await asyncio.to_thread(explainer.shap_values, X_test.loc[filtered.index])
        if isinstance(shap_values, list):
            shap_values = shap_values[1]

        # --- 9. Формируем JSON ---
        results = []
        for idx, (i, row) in enumerate(filtered.iterrows()):
            shap_importance = np.abs(shap_values[idx])
            top_idx = np.argsort(shap_importance)[-3:][::-1]
            important_feats = X_test.columns[top_idx]

            xai_details = [
                {"feature": feat, "value": float(row.get(feat, np.nan))}
                for feat in important_feats
            ]

            planet_info = {
                k: float(row.get(k, np.nan))
                for k in [
                    "koi_teq", "koi_insol", "koi_prad",
                    "koi_period", "koi_duration",
                    "koi_steff", "koi_srad", "koi_slogg"
                ]
                if k in df_test.columns
            }

            results.append({
                "id": idx + 1,
                "kepid": int(row[id_col]),
                "procent": float(row["procent"]),
                "xai": xai_details,
                "planet_info": planet_info
            })

        return {
            "status": "ok",
            "total_objects": total_objects,
            "count": len(results),
            "data": results
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))