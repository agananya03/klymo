FROM python:3.10

WORKDIR /app

COPY requirements.txt .
# Install git for source installation if needed
RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*

RUN uname -m && python --version && pip --version

# Try installing from source to bypass PyPI index issues
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir git+https://github.com/google/generative-ai-python.git && \
    pip install --no-cache-dir -r requirements.txt

COPY . .

ENV PYTHONUNBUFFERED=1

CMD ["python", "run.py"]