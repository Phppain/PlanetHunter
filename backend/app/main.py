# app/main.py
from fastapi import FastAPI, UploadFile, File, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import numpy as np
import shap
import joblib
import io
import asyncio
import os

# создаём таблицы

app = FastAPI(title="Exoplanet Detector API", description="AI модель для поиска экзопланет", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "API работает. Зарегистрируйтесь и залогиньтесь для использования /analyze/"}

@app.post("/analyze/")
async def analyze(
    file: UploadFile = File(...),
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