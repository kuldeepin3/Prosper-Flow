# Prosper Flow - AI Personal Finance Management Engine

Prosper Flow is a production-ready, private personal finance management system. It integrates local AI processing, document OCR extraction, privacy-shielded LLM chats, and detailed debt simulation tools to give you full visibility over your wealth journey with complete data ownership.

The application is structured into two main layers:
*   **Frontend**: A Next.js 14 Web Application in [`client/`](./client)
*   **Backend**: A FastAPI REST Service in [`server/`](./server)

---

## ✨ Features & Architecture

### 1. 📊 Financial Intelligence Dashboard
*   **Ledger Aggregation**: Real-time tracking of total income, expenses, net savings, and investments.
*   **Interactive Visual Analytics**:
    *   **Income vs. Expense Trends**: Multi-stage area charts representing monthly cash flow.
    *   **Expense Distribution**: Pie charts tracking spending categories.
    *   **Budget Burn Rate**: Real-time visualization of limit consumption with warning thresholds.

### 2. 🤖 Privacy-Shielded AI Copilot (RAG)
*   **Conversational Assistant**: Chat with your ledger using natural language to extract insights (e.g., *"How much did I spend on dining out last week?"*).
*   **Local Vector Search (RAG)**: Integrates vector embeddings using `nomic-embed-text` to query transactions semantically.
*   **Autonomous Tool Calling**: The Copilot can create transactions, set savings goals, and adjust budgets directly based on your chat prompt.
*   **PII Privacy Shield**: Integrates a regex anonymizer that masks emails, phone numbers, merchant names, and values *before* sending data to the LLM, de-anonymizing it locally to guarantee zero data leaks.

### 3. 📄 Local Document OCR Parsing
*   **Bank Statement Import**: Support for importing transaction statement screenshots (PNG/JPG) and PDFs.
*   **Local Extraction**: Utilizes `EasyOCR` on the backend for raw text extraction.
*   **Structured AI Schema**: Passes text to a local Llama model to parse raw transactions into structured JSON logs (Merchant, Date, Amount, Type) for immediate import.

### 4. 📈 Runway & Wealth Projections
*   **Runway Estimation**: Calculates monthly burn rates and projects how many months/days of liquidity your current cash and investment assets provide.
*   **Simulated Debt Payoff Calculator**:
    *   Compares the **Debt Snowball** (paying lowest balances first) vs. **Debt Avalanche** (paying highest interest first) models.
    *   Calculates exact target payoff dates, total interest paid, and total interest saved.

### 5. 💼 Assets & Liabilities Tracker
*   **Investments Portfolio**: Track asset holdings, units owned, purchase price, and real-time current market value calculations.
*   **Liabilities Ledger**: Log loans, education debt, and credits with EMI tracking, interest rates, and payment due dates.

### 6. ⚙️ Automation & Data Import
*   **Smart CSV Data Importer**: Upload legacy statement sheets. The backend maps columns automatically (Date, Payee, Amount) and uses vector similarity matching (cosine distance) to categorize imported items based on your past transactions.
*   **Recurring Engine**: An automated background worker that reconciles and posts transaction instances automatically for daily, weekly, monthly, or yearly recurring templates on startup and periodic loops.

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
    *   Create a `.env` file at the root or configure the variables in [`docker-compose.yml`](./docker-compose.yml).
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
1. Navigate to the [`server/`](./server) directory:
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
4. Create your local configurations file `.env` based on [`.env.example`](./server/.env.example):
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
1. Navigate to the [`client/`](./client) directory:
    ```bash
    cd client
    ```
2. Install npm packages:
    ```bash
    npm install
    ```
3. Configure your local configuration file [`.env.local`](./client/.env.local):
    ```env
    NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
    ```
4. Run the Next.js dev server:
    ```bash
    npm run dev
    ```
5. Open [http://localhost:3000](http://localhost:3000) in your browser.
# Prosper Flow - AI Personal Finance Management Engine

[⚡ Live Demo](https://prosper-flow.vercel.app)

## 🔒 Security Practices in Production

*   **Change Secrets**: Always change the default `JWT_SECRET` key to a securely generated 32-byte hex key.
*   **CORS Origins**: Avoid using `*` for `CORS_ORIGINS` in production. List only your domain (e.g., `https://yourdashboard.com`).
*   **Reverse Proxy**: In production, place a proxy like Nginx or Caddy in front of port `3000` (frontend) and `8080` (backend) to terminate HTTPS/SSL traffic.
