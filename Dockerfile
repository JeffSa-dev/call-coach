FROM python:3.9-slim

WORKDIR /app

# Copy requirements first for better caching
COPY ./api/requirements.txt /app/requirements.txt

# Install dependencies
RUN pip install --no-cache-dir --upgrade -r requirements.txt

# Copy the rest of the application
COPY ./api /app/api

# Make sure uvicorn is installed
RUN pip install uvicorn

# Changed main.py to index.py in the command
CMD ["python", "-m", "uvicorn", "api.index:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]