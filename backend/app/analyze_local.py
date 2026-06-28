import pandas as pd
import numpy as np
import shap
import joblib
import lightgbm as lgb
import json

# --- 1. Загружаем таблицы ---
df_original = pd.read_csv(
    "cumulative_2025.10.03_23.57.10.csv",
    comment="#",
    sep=",",
    low_memory=False
)

df_test = pd.read_csv("clean_kepler.csv")

# --- 2. Находим колонку kepid ---
id_col = [c for c in df_original.columns if "kepid" in c.lower()][0]

# --- 3. Добавляем kepid, если нет ---
if id_col not in df_test.columns:
    df_test[id_col] = df_original.loc[df_test.index, id_col].values

# --- 4. Загружаем обученную модель ---
model = joblib.load("model.pkl")

# --- 5. Определяем признаки и делаем предсказание ---
train_features = model.feature_name()
X_test = df_test[train_features]
df_test["procent"] = model.predict(X_test)

# --- 6. Фильтруем только вероятные планеты ---
filtered = df_test[df_test["procent"] > 0.5].copy()

# --- 7. Объяснение через SHAP ---
explainer = shap.TreeExplainer(model)
shap_values = explainer.shap_values(X_test.loc[filtered.index])
if isinstance(shap_values, list):
    shap_values = shap_values[1]

# --- 8. Формируем JSON с XAI и физическими характеристиками ---
results = []
for idx, (i, row) in enumerate(filtered.iterrows()):
    shap_importance = np.abs(shap_values[idx])
    top_idx = np.argsort(shap_importance)[-3:][::-1]
    important_feats = X_test.columns[top_idx]


    # создаём список XAI деталей
    xai_details = []
    for feat in important_feats:
        xai_details.append({
            "feature": feat,
            "value": float(row.get(feat, np.nan))
        })

    # физические признаки для сравнения с Землей
    planet_info = {k: float(row.get(k, np.nan)) for k in [
        "koi_teq", "koi_insol", "koi_prad",
        "koi_period", "koi_duration",
        "koi_steff", "koi_srad", "koi_slogg"
    ]}

    results.append({
        "id": idx + 1,
        "kepid": int(row[id_col]),
        "procent": float(row["procent"]),
        "xai": xai_details,
        "planet_info": planet_info
    })

# --- 9. Итоговый JSON-объект ---
response = {
    "total_objects": len(df_test),
    "detected_planets": len(results),
    "data": results
}

# --- 10. Сохраняем в JSON-файл ---
output_path = "submission_full.json"
with open(output_path, "w", encoding="utf-8") as f:
    json.dump(response, f, indent=4, ensure_ascii=False)

print(f"\n✅ JSON успешно сохранён: {output_path}")
print(f"Всего объектов: {len(df_test)}")
print(f"Найдено планет: {len(results)}")

# --- 11. Печатаем первые несколько результатов ---
for r in results[:3]:
    print(json.dumps(r, indent=2, ensure_ascii=False))
