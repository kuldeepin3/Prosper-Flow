import os
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
import models
from models import SessionLocal, init_db
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import datetime
import auth_service
import asyncio


init_db()

app = FastAPI(
    title="Prosper Flow API",
    description="Backend Transaction, Budget, and RAG service layer",
    version="1.0.0"
)

cors_origins_env = os.getenv("CORS_ORIGINS", "*")
if cors_origins_env == "*":
    origins = ["*"]
else:
    origins = [o.strip() for o in cors_origins_env.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security_scheme = HTTPBearer()

# Dependency to get db session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user_id(credentials: HTTPAuthorizationCredentials = Depends(security_scheme)) -> str:
    token = credentials.credentials
    payload = auth_service.decode_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return payload.get("user_id")


class UserRegister(BaseModel):
    email: str
    password: str
    full_name: Optional[str] = None
    preferred_currency: Optional[str] = "INR"

class UserLogin(BaseModel):
    email: str
    password: str

class AuthResponse(BaseModel):
    token: str
    user: Dict[str, Any]

class TransactionBase(BaseModel):
    amount: float
    type: str
    category: str
    transaction_date: str
    description: Optional[str] = None
    is_recurring: Optional[bool] = False
    recurrence_interval: Optional[str] = None



class TransactionCreate(TransactionBase):
    pass

class TransactionResponse(TransactionBase):
    id: str
    class Config:
        from_attributes = True

class BudgetCreate(BaseModel):
    category: str
    limit_amount: float

class BudgetResponse(BaseModel):
    id: str
    category: str
    limit_amount: float
    period: str
    rollover_enabled: bool
    class Config:
        from_attributes = True

class SavingsGoalCreate(BaseModel):
    name: str
    target_amount: float
    deadline: Optional[str] = None

class SavingsGoalResponse(BaseModel):
    id: str
    name: str
    target_amount: float
    current_amount: float
    deadline: Optional[str] = None
    class Config:
        from_attributes = True

class SavingsContribution(BaseModel):
    amount: float

class InvestmentCreate(BaseModel):
    asset_type: str
    symbol: str
    units: float
    purchase_price: float
    current_value: float
    buy_date: Optional[str] = None

class InvestmentResponse(InvestmentCreate):
    id: str
    class Config:
        from_attributes = True

class LiabilityCreate(BaseModel):
    type: str
    provider: str
    owed: float
    emi: Optional[float] = 0.0
    interest_rate: Optional[float] = 0.0
    due_date: Optional[str] = None

class LiabilityResponse(LiabilityCreate):
    id: str
    class Config:
        from_attributes = True

class LiabilityPayment(BaseModel):
    amount: float

class BudgetProgress(BaseModel):
    category: str
    limit_amount: float
    spent_amount: float
    percentage: float

class AnalyticsResponse(BaseModel):
    monthly_income: float
    monthly_expenses: float
    net_savings: float
    savings_rate: float
    budgets_progress: List[BudgetProgress]
    insights: List[str]

class RunwayProjectionPoint(BaseModel):
    month: str
    balance: float

class RunwayResponse(BaseModel):
    current_liquidity: float
    average_net_flow: float
    runway_days: int
    projection: List[RunwayProjectionPoint]
class AIQuery(BaseModel):
    prompt: str

# Endpoints
@app.get("/api/v1/health")
def health_check():
    return {"status": "healthy", "timestamp": datetime.datetime.now().isoformat()}

import json

# Auth Endpoints
@app.post("/api/v1/auth/register", response_model=AuthResponse)
def register(user: UserRegister, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed = auth_service.hash_password(user.password)
    db_user = models.User(
        email=user.email,
        password_hash=hashed,
        full_name=user.full_name,
        preferred_currency=user.preferred_currency
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    token = auth_service.create_access_token({"user_id": db_user.id})
    return {
        "token": token,
        "user": {
            "id": db_user.id,
            "email": db_user.email,
            "full_name": db_user.full_name,
            "preferred_currency": db_user.preferred_currency
        }
    }

@app.post("/api/v1/auth/login", response_model=AuthResponse)
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if not db_user or not auth_service.verify_password(user.password, db_user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    token = auth_service.create_access_token({"user_id": db_user.id})
    return {
        "token": token,
        "user": {
            "id": db_user.id,
            "email": db_user.email,
            "full_name": db_user.full_name,
            "preferred_currency": db_user.preferred_currency
        }
    }

def generate_and_save_embedding(tx_id: str, tx_text: str):
    db = SessionLocal()
    try:
        embedding = ai_service.get_embeddings(tx_text)
        if embedding:
            tx = db.query(models.Transaction).filter(models.Transaction.id == tx_id).first()
            if tx:
                tx.embedding_json = json.dumps(embedding)
                db.commit()
    except Exception as e:
        print(f"Error generating embedding in background: {e}")
    finally:
        db.close()

@app.post("/api/v1/transactions", response_model=TransactionResponse)
def create_transaction(tx: TransactionCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)):
    try:
        parsed_date = datetime.date.fromisoformat(tx.transaction_date)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Expected YYYY-MM-DD.")

    db_tx = models.Transaction(
        user_id=user_id,
        amount=tx.amount,
        type=tx.type,
        category=tx.category,
        transaction_date=parsed_date,
        description=tx.description,
        is_recurring=tx.is_recurring,
        recurrence_interval=tx.recurrence_interval,
        embedding_json=None
    )
    db.add(db_tx)
    db.commit()
    db.refresh(db_tx)

    tx_text = f"{tx.type} transaction of {tx.amount} in category {tx.category} on {tx.transaction_date}. Description: {tx.description or ''}"
    background_tasks.add_task(generate_and_save_embedding, db_tx.id, tx_text)

    db_tx.transaction_date = db_tx.transaction_date.isoformat()
    return db_tx

@app.get("/api/v1/transactions", response_model=List[TransactionResponse])
def read_transactions(db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)):
    txs = db.query(models.Transaction).filter(models.Transaction.user_id == user_id).all()
    # Format dates
    for t in txs:
        t.transaction_date = t.transaction_date.isoformat()
    return txs

import ai_service
from privacy_service import PrivacyGuard
import re

def execute_agent_tool(name: str, args: dict, db: Session, user_id: str, background_tasks: BackgroundTasks) -> dict:
    """
    Executes a tool call on the database for the given user.
    Returns status details to return in actions_taken.
    """
    try:
        if name == "update_budget":
            category = args.get("category")
            limit_amount = args.get("limit_amount")
            if not category or limit_amount is None:
                return {"status": "error", "tool": name, "message": "Missing arguments category or limit_amount"}
            
            # Find and update or create budget
            db_budget = db.query(models.Budget).filter(
                models.Budget.user_id == user_id,
                models.Budget.category == category
            ).first()
            if db_budget:
                db_budget.limit_amount = float(limit_amount)
            else:
                db_budget = models.Budget(
                    user_id=user_id,
                    category=category,
                    limit_amount=float(limit_amount)
                )
                db.add(db_budget)
            db.commit()
            return {
                "status": "success", 
                "tool": "update_budget",
                "details": {"category": category, "limit_amount": limit_amount}
            }
            
        elif name == "create_savings_goal":
            name_val = args.get("name")
            target_amount = args.get("target_amount")
            deadline_str = args.get("deadline")
            
            if not name_val or target_amount is None:
                return {"status": "error", "tool": name, "message": "Missing arguments name or target_amount"}
                
            deadline_date = None
            if deadline_str:
                try:
                    clean_date = deadline_str.split("T")[0]
                    deadline_date = datetime.date.fromisoformat(clean_date)
                except ValueError:
                    pass
                    
            db_goal = models.SavingsGoal(
                user_id=user_id,
                name=name_val,
                target_amount=float(target_amount),
                current_amount=0.0,
                deadline=deadline_date
            )
            db.add(db_goal)
            db.commit()
            return {
                "status": "success",
                "tool": "create_savings_goal",
                "details": {"name": name_val, "target_amount": target_amount, "deadline": deadline_str}
            }
            
        elif name == "create_transaction":
            amount = args.get("amount")
            tx_type = args.get("type")
            category = args.get("category")
            description = args.get("description")
            date_str = args.get("transaction_date")
            
            if amount is None or not tx_type or not category or not description:
                return {"status": "error", "tool": name, "message": "Missing required arguments for create_transaction"}
                
            tx_date = datetime.date.today()
            if date_str:
                try:
                    clean_date = date_str.split("T")[0]
                    tx_date = datetime.date.fromisoformat(clean_date)
                except ValueError:
                    pass
                    
            db_tx = models.Transaction(
                user_id=user_id,
                amount=float(amount),
                type=tx_type.upper(),
                category=category,
                description=description,
                transaction_date=tx_date
            )
            db.add(db_tx)
            db.commit()
            db.refresh(db_tx)

            tx_text = f"{db_tx.type} transaction of {db_tx.amount} in category {db_tx.category} on {db_tx.transaction_date.isoformat()}. Description: {db_tx.description or ''}"
            background_tasks.add_task(generate_and_save_embedding, db_tx.id, tx_text)

            return {
                "status": "success",
                "tool": "create_transaction",
                "details": {
                    "amount": amount,
                    "type": tx_type,
                    "category": category,
                    "description": description,
                    "date": tx_date.isoformat()
                }
            }
            
        return {"status": "error", "tool": name, "message": f"Unknown tool: {name}"}
    except Exception as e:
        db.rollback()
        return {"status": "error", "tool": name, "message": str(e)}

@app.post("/api/v1/ai/query")
def query_copilot(query: AIQuery, background_tasks: BackgroundTasks, db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)):
    prompt = query.prompt.lower()
    
    # Initialize Privacy Guard
    guard = PrivacyGuard()
    
    # Anonymize user prompt
    anon_prompt, deanon_map = guard.anonymize(prompt)
    
    # Quick database aggregations to seed context
    from sqlalchemy import func
    total_in = db.query(func.sum(models.Transaction.amount)).filter(
        models.Transaction.user_id == user_id,
        models.Transaction.type == "INCOME"
    ).scalar() or 0.0
    total_out = db.query(func.sum(models.Transaction.amount)).filter(
        models.Transaction.user_id == user_id,
        models.Transaction.type == "EXPENSE"
    ).scalar() or 0.0
    
    # Generate system prompt with basic user context
    system_content = (
        "You are a helpful financial assistant called Antigravity Copilot. "
        "You help users analyze transactions, track budgets, and manage savings. "
        "You have tools available to modify database records when the user asks you to update, set, log, or create items. "
        "CRITICAL: Only invoke a tool when the user explicitly requests you to modify, add, set, log, or delete records. "
        "If the user is just saying hello, greeting you, or asking a general question (e.g. 'hi', 'how are you?', 'how does this work?'), "
        "DO NOT call any tools. Just chat with them normally and offer assistance. "
        f"The user's total logged income is ₹{total_in} and total logged expenses are ₹{total_out}. "
    )
    
    # Retrieve relevant transactions using embeddings (calculated locally and privately)
    query_embedding = ai_service.get_embeddings(prompt)
    if query_embedding:
        all_tx = db.query(models.Transaction).filter(models.Transaction.user_id == user_id).all()
        relevant_tx = ai_service.retrieve_relevant_transactions(query_embedding, all_tx, top_k=5)
        
        if relevant_tx:
            tx_context = "\n".join([
                f"- {tx.transaction_date}: {tx.type} ₹{tx.amount} ({tx.category}) - {tx.description or ''}" 
                for tx in relevant_tx
            ])
            # Anonymize the transaction context before sending to completion engine
            anon_tx_context, tx_map = guard.anonymize(tx_context)
            deanon_map.update(tx_map)
            
            system_content += f"\n\nHere are some relevant past transactions that might help answer the user:\n{anon_tx_context}"
 
    system_message = {
        "role": "system", 
        "content": system_content
    }

    user_message = {"role": "user", "content": anon_prompt}
    
    # Call local Ollama LLM with tool completions enabled
    response_text, tool_calls = ai_service.get_llm_response([system_message, user_message], use_tools=True)
    
    print(f"[DEBUG] Raw response_text: {response_text!r}")
    print(f"[DEBUG] Parsed tool_calls: {tool_calls!r}")
    
    # Execute any tool calls returned by the agent
    actions_taken = []
    for tc in tool_calls:
        func_name = tc["function"]["name"]
        try:
            func_args = json.loads(tc["function"]["arguments"]) if isinstance(tc["function"]["arguments"], str) else tc["function"]["arguments"]
        except Exception:
            func_args = {}
        
        # Deanonymize tool arguments using deanon_map
        if isinstance(func_args, dict) and deanon_map:
            try:
                args_str = json.dumps(func_args)
                deanon_args_str = guard.deanonymize(args_str, deanon_map)
                func_args = json.loads(deanon_args_str)
            except Exception:
                pass

        # Execute tool changes
        action_res = execute_agent_tool(func_name, func_args, db, user_id, background_tasks)
        actions_taken.append(action_res)
        
    # De-anonymize LLM's response
    deanon_response = guard.deanonymize(response_text, deanon_map)
    
    # Clean up any raw text command formats so the user doesn't see raw CALL brackets or code blocks
    cleaned_response = re.sub(r'\[CALL:\s*\w+\(.*?\)\]', '', deanon_response, flags=re.IGNORECASE)
    cleaned_response = re.sub(r'```json\s*\{.*?\s*\}\s*```', '', cleaned_response, flags=re.DOTALL)
    cleaned_response = cleaned_response.strip()
    
    if not cleaned_response:
        if actions_taken and all(a["status"] == "success" for a in actions_taken):
            cleaned_response = "I have successfully processed your request and updated your financial records."
        else:
            cleaned_response = "I have reviewed your request but could not make the updates."

    return {
        "response": cleaned_response,
        "actions_taken": actions_taken
    }

import ocr_service

@app.post("/api/v1/parse", summary="Parse receipt or invoice")
async def parse_document(file: UploadFile = File(...), user_id: str = Depends(get_current_user_id)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
        
    allowed_extensions = {".jpg", ".jpeg", ".png", ".pdf", ".webp"}
    ext = file.filename.lower()
    if not any(ext.endswith(e) for e in allowed_extensions):
        raise HTTPException(status_code=400, detail="Unsupported file format")
        
    try:
        content = await file.read()
        
        # 1. Run OCR Pipeline
        ocr_text = ocr_service.run_ocr_pipeline(content, file.filename)
        
        if not ocr_text:
            return {"parsed_data": {}, "message": "No text extracted from document"}
            
        # 2. Parse text with LLM
        parsed_data = ocr_service.parse_with_llm(ocr_text)
        
        return {
            "parsed_data": parsed_data,
            "raw_text": ocr_text,
            "filename": file.filename
        }
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"Error in parse_document: {error_trace}")
        raise HTTPException(status_code=500, detail=str(e) + " | Traceback: " + error_trace)

# DELETE Transaction
@app.delete("/api/v1/transactions/{tx_id}")
def delete_transaction(tx_id: str, db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)):
    tx = db.query(models.Transaction).filter(
        models.Transaction.id == tx_id,
        models.Transaction.user_id == user_id
    ).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    db.delete(tx)
    db.commit()
    return {"message": "Transaction deleted successfully"}

# Budgets Endpoints
@app.get("/api/v1/budgets", response_model=List[BudgetResponse])
def get_budgets(db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)):
    return db.query(models.Budget).filter(models.Budget.user_id == user_id).all()

@app.post("/api/v1/budgets", response_model=BudgetResponse)
def create_or_update_budget(budget: BudgetCreate, db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)):
    db_budget = db.query(models.Budget).filter(
        models.Budget.category == budget.category,
        models.Budget.user_id == user_id
    ).first()
    if db_budget:
        db_budget.limit_amount = budget.limit_amount
    else:
        db_budget = models.Budget(
            user_id=user_id,
            category=budget.category,
            limit_amount=budget.limit_amount,
            period="MONTHLY"
        )
        db.add(db_budget)
    db.commit()
    db.refresh(db_budget)
    return db_budget

# Savings Goals Endpoints
@app.get("/api/v1/savings", response_model=List[SavingsGoalResponse])
def get_savings_goals(db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)):
    goals = db.query(models.SavingsGoal).filter(models.SavingsGoal.user_id == user_id).all()
    for g in goals:
        if g.deadline:
            g.deadline = g.deadline.isoformat()
    return goals

@app.post("/api/v1/savings", response_model=SavingsGoalResponse)
def create_savings_goal(goal: SavingsGoalCreate, db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)):
    deadline_date = None
    if goal.deadline:
        deadline_date = datetime.date.fromisoformat(goal.deadline)
    db_goal = models.SavingsGoal(
        user_id=user_id,
        name=goal.name,
        target_amount=goal.target_amount,
        current_amount=0.0,
        deadline=deadline_date
    )
    db.add(db_goal)
    db.commit()
    db.refresh(db_goal)
    if db_goal.deadline:
        db_goal.deadline = db_goal.deadline.isoformat()
    return db_goal

@app.post("/api/v1/savings/{goal_id}/contribute", response_model=SavingsGoalResponse)
def contribute_to_savings_goal(goal_id: str, contribution: SavingsContribution, db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)):
    db_goal = db.query(models.SavingsGoal).filter(
        models.SavingsGoal.id == goal_id,
        models.SavingsGoal.user_id == user_id
    ).first()
    if not db_goal:
        raise HTTPException(status_code=404, detail="Savings goal not found")
    db_goal.current_amount += contribution.amount
    db.commit()
    db.refresh(db_goal)
    if db_goal.deadline:
        db_goal.deadline = db_goal.deadline.isoformat()
    return db_goal

# Investments Endpoints
@app.get("/api/v1/investments", response_model=List[InvestmentResponse])
def get_investments(db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)):
    invs = db.query(models.Investment).filter(models.Investment.user_id == user_id).all()
    for inv in invs:
        if inv.buy_date:
            inv.buy_date = inv.buy_date.isoformat()
    return invs

@app.post("/api/v1/investments", response_model=InvestmentResponse)
def create_investment(inv: InvestmentCreate, db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)):
    buy_date = None
    if inv.buy_date:
        buy_date = datetime.date.fromisoformat(inv.buy_date)
    db_inv = models.Investment(
        user_id=user_id,
        asset_type=inv.asset_type,
        symbol=inv.symbol,
        units=inv.units,
        purchase_price=inv.purchase_price,
        current_value=inv.current_value,
        buy_date=buy_date
    )
    db.add(db_inv)
    db.commit()
    db.refresh(db_inv)
    if db_inv.buy_date:
        db_inv.buy_date = db_inv.buy_date.isoformat()
    return db_inv

# Liabilities Endpoints
@app.get("/api/v1/liabilities", response_model=List[LiabilityResponse])
def get_liabilities(db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)):
    libs = db.query(models.Liability).filter(models.Liability.user_id == user_id).all()
    for lib in libs:
        if lib.due_date:
            lib.due_date = lib.due_date.isoformat()
    return libs

@app.post("/api/v1/liabilities", response_model=LiabilityResponse)
def create_or_update_liability(lib: LiabilityCreate, db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)):
    db_lib = db.query(models.Liability).filter(
        models.Liability.user_id == user_id,
        models.Liability.provider == lib.provider,
        models.Liability.type == lib.type
    ).first()
    
    due_date = None
    if lib.due_date:
        due_date = datetime.date.fromisoformat(lib.due_date)

    if db_lib:
        db_lib.owed = lib.owed
        db_lib.emi = lib.emi
        db_lib.interest_rate = lib.interest_rate
        db_lib.due_date = due_date
    else:
        db_lib = models.Liability(
            user_id=user_id,
            type=lib.type,
            provider=lib.provider,
            owed=lib.owed,
            emi=lib.emi,
            interest_rate=lib.interest_rate,
            due_date=due_date
        )
        db.add(db_lib)
    
    db.commit()
    db.refresh(db_lib)
    if db_lib.due_date:
        db_lib.due_date = db_lib.due_date.isoformat()
    return db_lib

@app.delete("/api/v1/liabilities/{lib_id}")
def delete_liability(lib_id: str, db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)):
    db_lib = db.query(models.Liability).filter(
        models.Liability.id == lib_id,
        models.Liability.user_id == user_id
    ).first()
    if not db_lib:
        raise HTTPException(status_code=404, detail="Liability not found")
    db.delete(db_lib)
    db.commit()
    return {"message": "Liability deleted successfully"}

@app.post("/api/v1/liabilities/{lib_id}/pay", response_model=LiabilityResponse)
def pay_liability(lib_id: str, payment: LiabilityPayment, db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)):
    db_lib = db.query(models.Liability).filter(
        models.Liability.id == lib_id,
        models.Liability.user_id == user_id
    ).first()
    if not db_lib:
        raise HTTPException(status_code=404, detail="Liability not found")
    
    amount_paid = payment.amount
    db_lib.owed = max(0.0, db_lib.owed - amount_paid)
    
    db_tx = models.Transaction(
        user_id=user_id,
        amount=amount_paid,
        type="EXPENSE",
        category="EMI",
        transaction_date=datetime.date.today(),
        description=f"Payment of ₹{amount_paid:,.2f} to {db_lib.provider} ({db_lib.type})"
    )
    db.add(db_tx)
    
    db.commit()
    db.refresh(db_lib)
    if db_lib.due_date:
        db_lib.due_date = db_lib.due_date.isoformat()
    return db_lib

from sqlalchemy import extract

@app.get("/api/v1/analytics", response_model=AnalyticsResponse)
def get_analytics(month: int, year: int, db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)):
    txs = db.query(models.Transaction).filter(
        models.Transaction.user_id == user_id,
        extract('year', models.Transaction.transaction_date) == year,
        extract('month', models.Transaction.transaction_date) == month
    ).all()

    monthly_income = sum(t.amount for t in txs if t.type == "INCOME")
    monthly_expenses = sum(t.amount for t in txs if t.type == "EXPENSE")
    net_savings = monthly_income - monthly_expenses
    savings_rate = (net_savings / monthly_income * 100) if monthly_income > 0 else 0.0

    budgets = db.query(models.Budget).filter(models.Budget.user_id == user_id).all()
    budgets_progress = []
    insights = []

    for b in budgets:
        spent = sum(t.amount for t in txs if t.type == "EXPENSE" and t.category.lower() == b.category.lower())
        pct = (spent / b.limit_amount * 100) if b.limit_amount > 0 else 0.0
        budgets_progress.append(BudgetProgress(
            category=b.category,
            limit_amount=b.limit_amount,
            spent_amount=spent,
            percentage=pct
        ))

        if pct >= 100:
            insights.append(f"⚠️ Budget Alert: You have exceeded your {b.category} budget of ₹{b.limit_amount:,.2f} (spent ₹{spent:,.2f}).")
        elif pct >= 80:
            insights.append(f"⚠️ Warning: You have consumed {pct:.1f}% of your {b.category} budget limit (spent ₹{spent:,.2f} of ₹{b.limit_amount:,.2f}).")

    prev_month = month - 1 if month > 1 else 12
    prev_year = year if month > 1 else year - 1

    prev_txs = db.query(models.Transaction).filter(
        models.Transaction.user_id == user_id,
        extract('year', models.Transaction.transaction_date) == prev_year,
        extract('month', models.Transaction.transaction_date) == prev_month
    ).all()
    prev_expenses = sum(t.amount for t in prev_txs if t.type == "EXPENSE")

    if prev_expenses > 0:
        diff = monthly_expenses - prev_expenses
        var_pct = (diff / prev_expenses) * 100
        if var_pct > 10:
            insights.append(f"📉 Spend Increase: Your monthly expenses increased by {var_pct:.1f}% compared to last month.")
        elif var_pct < -10:
            insights.append(f"🎉 Great Job! Your monthly spending is down by {abs(var_pct):.1f}% compared to last month.")
    else:
        if monthly_expenses > 0:
            insights.append("📊 First Month: Tracking your initial spending patterns. Keep it up!")

    if savings_rate >= 30:
        insights.append(f"🏆 High Savings: Excellent! You saved {savings_rate:.1f}% of your income this month.")
    elif savings_rate < 10 and monthly_income > 0:
        insights.append("💡 Suggestion: Try to review your non-essential budgets. Your savings rate is below 10% this month.")

    return AnalyticsResponse(
        monthly_income=monthly_income,
        monthly_expenses=monthly_expenses,
        net_savings=net_savings,
        savings_rate=savings_rate,
        budgets_progress=budgets_progress,
        insights=insights
    )

from sqlalchemy import func

@app.get("/api/v1/analytics/runway", response_model=RunwayResponse)
def get_runway_analytics(db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)):
    # 1. Fetch all transactions
    txs = db.query(models.Transaction).filter(models.Transaction.user_id == user_id).all()
    
    # 2. Fetch current savings goals and investments
    total_savings = db.query(func.sum(models.SavingsGoal.current_amount)).filter(models.SavingsGoal.user_id == user_id).scalar() or 0.0
    total_investments = db.query(func.sum(models.Investment.units * models.Investment.current_value)).filter(models.Investment.user_id == user_id).scalar() or 0.0
    
    # 3. Net ledger cash
    total_income = sum(t.amount for t in txs if t.type == "INCOME")
    total_expense = sum(t.amount for t in txs if t.type == "EXPENSE")
    net_ledger = total_income - total_expense
    
    # Current total liquidity
    current_liquidity = max(0.0, float(total_savings + total_investments + net_ledger))
    
    # 4. Group by month to find net flow and burn rate
    monthly_flows = {}
    for t in txs:
        month_str = t.transaction_date.strftime("%Y-%m")
        if month_str not in monthly_flows:
            monthly_flows[month_str] = {"income": 0.0, "expense": 0.0}
        if t.type == "INCOME":
            monthly_flows[month_str]["income"] += t.amount
        elif t.type == "EXPENSE":
            monthly_flows[month_str]["expense"] += t.amount
            
    # Calculate net flow for each month
    net_flows = []
    for m, vals in sorted(monthly_flows.items(), reverse=True):
        net_flows.append(vals["income"] - vals["expense"])
        
    # Find average monthly net flow (take last 3 months if available, or all)
    last_flows = net_flows[:3] if net_flows else [0.0]
    average_net_flow = sum(last_flows) / len(last_flows) if last_flows else 0.0
    
    # If the user has zero monthly net flows and zero transactions, default to positive 0
    if not net_flows:
        average_net_flow = 0.0
        
    # Calculate runway days
    if average_net_flow < 0:
        monthly_burn = abs(average_net_flow)
        runway_months = current_liquidity / monthly_burn
        runway_days = int(runway_months * 30.4)
    else:
        runway_days = -1
        
    # 5. Generate 6-month projection
    projection = []
    projection.append(RunwayProjectionPoint(month="Current", balance=current_liquidity))
    
    today = datetime.date.today()
    for i in range(1, 7):
        future_month = today.month + i
        future_year = today.year + (future_month - 1) // 12
        future_month = (future_month - 1) % 12 + 1
        month_label = f"{future_year}-{future_month:02d}"
        
        projected_balance = max(0.0, current_liquidity + i * average_net_flow)
        projection.append(RunwayProjectionPoint(month=month_label, balance=projected_balance))
        
    return RunwayResponse(
        current_liquidity=current_liquidity,
        average_net_flow=average_net_flow,
        runway_days=runway_days,
        projection=projection
    )

async def reconcile_recurring_transactions():
    db = SessionLocal()
    try:
        recurring_templates = db.query(models.Transaction).filter(models.Transaction.is_recurring == True).all()
        today = datetime.date.today()
        
        for template in recurring_templates:
            already_exists = False
            if template.recurrence_interval == "DAILY":
                already_exists = db.query(models.Transaction).filter(
                    models.Transaction.user_id == template.user_id,
                    models.Transaction.description == template.description,
                    models.Transaction.amount == template.amount,
                    models.Transaction.transaction_date == today
                ).count() > 0
            elif template.recurrence_interval == "WEEKLY":
                seven_days_ago = today - datetime.timedelta(days=7)
                already_exists = db.query(models.Transaction).filter(
                    models.Transaction.user_id == template.user_id,
                    models.Transaction.description == template.description,
                    models.Transaction.amount == template.amount,
                    models.Transaction.transaction_date >= seven_days_ago
                ).count() > 0
            elif template.recurrence_interval == "MONTHLY":
                start_of_month = today.replace(day=1)
                already_exists = db.query(models.Transaction).filter(
                    models.Transaction.user_id == template.user_id,
                    models.Transaction.description == template.description,
                    models.Transaction.amount == template.amount,
                    models.Transaction.transaction_date >= start_of_month
                ).count() > 0
            elif template.recurrence_interval == "YEARLY":
                start_of_year = today.replace(month=1, day=1)
                already_exists = db.query(models.Transaction).filter(
                    models.Transaction.user_id == template.user_id,
                    models.Transaction.description == template.description,
                    models.Transaction.amount == template.amount,
                    models.Transaction.transaction_date >= start_of_year
                ).count() > 0
                
            if not already_exists:
                new_tx = models.Transaction(
                    user_id=template.user_id,
                    amount=template.amount,
                    type=template.type,
                    category=template.category,
                    transaction_date=today,
                    description=template.description,
                    is_recurring=False,
                    recurrence_interval=None,
                    embedding_json=template.embedding_json
                )
                db.add(new_tx)
                db.commit()
                print(f"Generated recurring transaction: {template.description} for user {template.user_id}")
    except Exception as e:
        print(f"Error in reconcile_recurring_transactions: {e}")
    finally:
        db.close()

@app.post("/api/v1/transactions/import-image")
async def import_image_transactions(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...), 
    db: Session = Depends(get_db), 
    user_id: str = Depends(get_current_user_id)
):
    allowed_extensions = {".jpg", ".jpeg", ".png", ".pdf", ".webp"}
    ext = file.filename.lower()
    if not any(ext.endswith(e) for e in allowed_extensions):
        raise HTTPException(status_code=400, detail="Invalid file type. Supported types: JPG, JPEG, PNG, PDF, WEBP")
        
    try:
        content = await file.read()
        
        # 1. Run OCR Pipeline
        ocr_text = ocr_service.run_ocr_pipeline(content, file.filename)
        if not ocr_text:
            return {"imported": 0, "message": "No text extracted from document"}
            
        # 2. Parse text with LLM
        transactions_list = ocr_service.parse_statement_with_llm(ocr_text)
        
        if not transactions_list or not isinstance(transactions_list, list):
            return {"imported": 0, "message": "Could not parse any transactions from the image"}
            
        imported_count = 0
        for tx in transactions_list:
            amount = tx.get("amount")
            tx_type = tx.get("type", "EXPENSE").upper()
            category = tx.get("category", "General")
            description = tx.get("description", "Imported Transaction")
            date_str = tx.get("date")
            
            if amount is None or not description:
                continue
                
            tx_date = datetime.date.today()
            if date_str:
                try:
                    clean_date = date_str.split("T")[0]
                    tx_date = datetime.date.fromisoformat(clean_date)
                except ValueError:
                    pass
            
            # Create transaction
            db_tx = models.Transaction(
                user_id=user_id,
                amount=float(amount),
                type=tx_type,
                category=category,
                description=description,
                transaction_date=tx_date
            )
            db.add(db_tx)
            db.commit()
            db.refresh(db_tx)
            
            # Generate embedding in the background
            tx_text = f"{db_tx.type} transaction of {db_tx.amount} in category {db_tx.category} on {db_tx.transaction_date}. Description: {db_tx.description or ''}"
            background_tasks.add_task(generate_and_save_embedding, db_tx.id, tx_text)
            
            imported_count += 1
            
        return {
            "imported": imported_count,
            "message": f"Successfully parsed and imported {imported_count} transactions from the statement image!"
        }
    except Exception as e:
        import traceback
        print(f"Error in import_image_transactions: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))

import csv
import io

@app.post("/api/v1/transactions/import")
async def import_csv_transactions(file: UploadFile = File(...), db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")
        
    try:
        content = await file.read()
        stream = io.StringIO(content.decode('utf-8'))
        reader = csv.reader(stream)
        rows = list(reader)
        
        if not rows:
            return {"imported": 0, "message": "CSV is empty"}
            
        headers = [h.strip().lower() for h in rows[0]]
        
        date_idx, desc_idx, amount_idx = -1, -1, -1
        for idx, h in enumerate(headers):
            if "date" in h:
                date_idx = idx
            elif any(k in h for k in ["desc", "narrative", "info", "particulars", "payee", "merchant"]):
                desc_idx = idx
            elif any(k in h for k in ["amount", "value", "debit", "credit", "sum"]):
                amount_idx = idx
                
        if date_idx == -1 or desc_idx == -1 or amount_idx == -1:
            raise HTTPException(status_code=400, detail="Could not map required columns: Date, Description, and Amount are required.")
            
        user_txs = db.query(models.Transaction).filter(models.Transaction.user_id == user_id).all()
        imported_count = 0
        
        for row in rows[1:]:
            if not row or len(row) <= max(date_idx, desc_idx, amount_idx):
                continue
                
            raw_date = row[date_idx].strip()
            raw_desc = row[desc_idx].strip()
            raw_amount_str = row[amount_idx].strip().replace(",", "")
            
            if not raw_date or not raw_desc or not raw_amount_str:
                continue
                
            try:
                parsed_date = None
                for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%m/%d/%Y", "%d-%m-%Y"):
                    try:
                        parsed_date = datetime.datetime.strptime(raw_date, fmt).date()
                        break
                    except ValueError:
                        continue
                if not parsed_date:
                    parsed_date = datetime.date.today()
                    
                amount = float(raw_amount_str)
                tx_type = "INCOME" if amount > 0 else "EXPENSE"
                abs_amount = abs(amount)
                
                is_duplicate = db.query(models.Transaction).filter(
                    models.Transaction.user_id == user_id,
                    models.Transaction.description == raw_desc,
                    models.Transaction.amount == abs_amount,
                    models.Transaction.transaction_date == parsed_date
                ).count() > 0
                
                if is_duplicate:
                    continue
                
                matched_category = "Food" # default fallback
                
                row_embedding = ai_service.get_embeddings(raw_desc)
                if row_embedding and user_txs:
                    scored = []
                    for utx in user_txs:
                        if not utx.embedding_json:
                            continue
                        utx_embedding = json.loads(utx.embedding_json)
                        score = ai_service.calculate_cosine_similarity(row_embedding, utx_embedding)
                        scored.append((score, utx.category))
                    
                    if scored:
                        scored.sort(key=lambda x: x[0], reverse=True)
                        best_score, best_cat = scored[0]
                        if best_score > 0.8:
                            matched_category = best_cat
                            
                if matched_category == "Food" and user_txs:
                    desc_lower = raw_desc.lower()
                    if any(k in desc_lower for k in ["salary", "paycheck", "bonus", "direct deposit"]):
                        matched_category = "Salary"
                    elif any(k in desc_lower for k in ["uber", "ola", "metro", "train", "cab", "taxi"]):
                        matched_category = "Travel"
                    elif any(k in desc_lower for k in ["rent", "landlord"]):
                        matched_category = "Rent"
                    elif any(k in desc_lower for k in ["netflix", "spotify", "amazon prime", "youtube premium"]):
                        matched_category = "Subscriptions"
                    elif any(k in desc_lower for k in ["electricity", "water", "wifi", "broadband", "power"]):
                        matched_category = "Utilities"
                        
                embedding_json = json.dumps(row_embedding) if row_embedding else None
                
                db_tx = models.Transaction(
                    user_id=user_id,
                    amount=abs_amount,
                    type=tx_type,
                    category=matched_category,
                    transaction_date=parsed_date,
                    description=raw_desc,
                    is_recurring=False,
                    recurrence_interval=None,
                    embedding_json=embedding_json
                )
                db.add(db_tx)
                imported_count += 1
            except Exception as row_error:
                print(f"Error parsing row {row}: {row_error}")
                continue
                
        db.commit()
        return {"imported": imported_count, "message": f"Successfully imported {imported_count} transactions"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.on_event("startup")
async def startup_event():
    await reconcile_recurring_transactions()
    
    async def loop():
        while True:
            await asyncio.sleep(3600)
            await reconcile_recurring_transactions()
            
    asyncio.create_task(loop())




