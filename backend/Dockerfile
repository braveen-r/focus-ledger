FROM python:3.12-slim

WORKDIR /app

# Install uv for blazingly fast dependency management
RUN pip install uv

# Copy the dependency file and install
COPY pyproject.toml .
RUN uv pip install --system -r pyproject.toml

# Copy the rest of the application
COPY . .

EXPOSE 8001

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]
