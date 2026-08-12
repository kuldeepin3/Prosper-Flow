# Antigravity - AI Personal Finance Management Engine

Antigravity is a production-ready, private personal finance management system. It features transaction logging, automated budget tracking, savings goal management, vector-embedded semantic search queries, and local OCR-based transaction statement parsing.

The application is structured into two main layers:
*   **Frontend**: A Next.js 14 Web Application in [`client/`](file:///K:/data/Cd/Antigravity/financial%20Tracker/client)
*   **Backend**: A FastAPI REST Service in [`server/`](file:///K:/data/Cd/Antigravity/financial%20Tracker/server)

---

## 🛠️ Production Docker Deployment

The fastest way to deploy the entire stack (Frontend, Backend, and a persistent PostgreSQL database) in a production environment is using Docker Compose.

### Prerequisites
1. Install [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/).
2. Ensure you have Ollama running on your host machine for AI queries and vector embeddings.

### Deployment Steps

1. **Clone & Navigate**:
    Ensure you are at the project root directory.

2. **Configure Environment Variables**:
    *   Create a `.env` file at the root or configure the variables in [`docker-compose.yml`](file:///K:/data/Cd/Antigravity/financial%20Tracker/docker-compose.yml).
    *   Set a secure `JWT_SECRET` key for authentication signatures.

3. **Enable Ollama Host Connection**:
    Ensure your host machine's Ollama service accepts network connections.
    *   **Windows**: Set system environment variable `OLLAMA_HOST=0.0.0.0` and restart Ollama.
    *   **Linux/macOS**: Run `OLLAMA_HOST=0.0.0.0 ollama serve`.

4. **Launch Containers**:
    Execute the build and launch command:
    ```bash
    docker compose up --build -d
    ```

5. **Verify Access**:
    *   Frontend Client Dashboard: [http://localhost:3000](http://localhost:3000)
    *   Backend Interactive API Swagger UI: [http://localhost:8080/docs](http://localhost:8080/docs)

---

## 💻 Local Development Setup

To run the frontend and backend servers separately for development and testing:

### Backend Setup (FastAPI)
1. Navigate to the [`server/`](file:///K:/data/Cd/Antigravity/financial%20Tracker/server) directory:
    ```bash
    cd server
    ```
2. Activate your virtual environment:
    ```bash
    # Windows
    .\venv\Scripts\activate
    
    # macOS/Linux
    source venv/bin/activate
    ```
3. Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
4. Create your local configurations file `.env` based on [`.env.example`](file:///K:/data/Cd/Antigravity/financial%20Tracker/server/.env.example):
    ```env
    DATABASE_URL=sqlite:///./financial_tracker.db
    JWT_SECRET=your_dev_secret_key_here
    CORS_ORIGINS=*
    ```
5. Run the development server:
    ```bash
    python -m uvicorn main:app --reload --port 8080
    ```

### Frontend Setup (Next.js)
1. Navigate to the [`client/`](file:///K:/data/Cd/Antigravity/financial%20Tracker/client) directory:
    ```bash
    cd client
    ```
2. Install npm packages:
    ```bash
    npm install
    ```
3. Configure your local configuration file [`.env.local`](file:///K:/data/Cd/Antigravity/financial%20Tracker/client/.env.local):
    ```env
    NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
    ```
4. Run the Next.js dev server:
    ```bash
    npm run dev
    ```
5. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔒 Security Practices in Production

*   **Change Secrets**: Always change the default `JWT_SECRET` key to a securely generated 32-byte hex key.
*   **CORS Origins**: Avoid using `*` for `CORS_ORIGINS` in production. List only your domain (e.g., `https://yourdashboard.com`).
*   **Reverse Proxy**: In production, place a proxy like Nginx or Caddy in front of port `3000` (frontend) and `8080` (backend) to terminate HTTPS/SSL traffic.
