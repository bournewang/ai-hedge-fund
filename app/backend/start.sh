# poetry run uvicorn main:app --reload 

echo "Starting FastAPI app on PORT=${PORT:-8080}..."
poetry run uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080}
