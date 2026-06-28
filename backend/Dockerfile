# 1️⃣ Базовый образ Python
FROM python:3.11-slim AS backend

WORKDIR /app

# 2️⃣ Устанавливаем зависимости
COPY backend/requirements.txt .
RUN pip install --default-timeout=1000 --no-cache-dir -r requirements.txt
RUN apt-get update && apt-get install -y libgomp1 gcc g++ && rm -rf /var/lib/apt/lists/*


# 3️⃣ Копируем код
COPY backend/ .

# 4️⃣ Запуск FastAPI через uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
