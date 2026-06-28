import pandas as pd
import numpy as np
import shap
import joblib
import lightgbm as lgb
import json

df_original = pd.read_csv(
    "cumulative_2025.10.03_23.57.10.csv",
    comment="#",
    sep=",",
    low_memory=False
)
id_col = [c for c in df_original.columns if "kepid" in c.lower()][0]

df_test = pd.read_csv("clean_kepler.csv")

if id_col not in df_test.columns:
    df_test[id_col] = df_original.loc[df_test.index, id_col].values

model = joblib.load("model.pkl")

train_features = model.feature_name()
X_test = df_test[train_features]

df_test["procent"] = model.predict(X_test)
filtered = df_test[df_test["procent"] > 0.5].copy()

explainer = shap.TreeExplainer(model)
shap_values = explainer.shap_values(X_test.loc[filtered.index])
if isinstance(shap_values, list):
    shap_values = shap_values[1]

top_features = []
for i in range(len(filtered)):
    shap_importance = np.abs(shap_values[i])
    top_idx = np.argsort(shap_importance)[-3:][::-1]
    important_feats = X_test.columns[top_idx]
    top_features.append(", ".join(important_feats))

filtered["xai"] = top_features
submission = filtered[[id_col, "procent", "xai"]]
submission.to_csv("submission.csv", index=False)
print(submission.head(50))

# сохранить в json

json_df = submission[[id_col, "procent", "xai"]].copy()
json_df.rename(columns={id_col: "kepid"}, inplace=True)
json_df.insert(0, "id", range(1, len(json_df) + 1))

json_path = "submission.json"
json_df.to_json(json_path, orient="records", indent=4, force_ascii=False)

print(f"\nJSON успешно сохранён: {json_path}")
print(json_df.head(10))