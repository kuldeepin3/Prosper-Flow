import os
from dotenv import load_dotenv
load_dotenv()

from sqlalchemy import create_engine, Column, String, Float, DateTime, Boolean, Date, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, sessionmaker
import datetime
import uuid

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./financial_tracker.db") # Local fallback db

if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    full_name = Column(String)
    preferred_currency = Column(String, default="INR")
    is_mfa_enabled = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    transactions = relationship("Transaction", back_populates="user")
    budgets = relationship("Budget", back_populates="user")
    savings = relationship("SavingsGoal", back_populates="user")
    investments = relationship("Investment", back_populates="user")
    liabilities = relationship("Liability", back_populates="user")

class Transaction(Base):
    __tablename__ = "transactions"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"))
    amount = Column(Float, nullable=False)
    type = Column(String, nullable=False) # INCOME or EXPENSE
    category = Column(String, nullable=False)
    transaction_date = Column(Date, nullable=False)
    description = Column(String)
    is_recurring = Column(Boolean, default=False)
    recurrence_interval = Column(String) # DAILY, WEEKLY, MONTHLY, YEARLY
    embedding_json = Column(String, nullable=True) # To store vector embedding as JSON string

    user = relationship("User", back_populates="transactions")

class Budget(Base):
    __tablename__ = "budgets"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"))
    category = Column(String, nullable=False)
    limit_amount = Column(Float, nullable=False)
    period = Column(String, default="MONTHLY")
    start_date = Column(Date)
    end_date = Column(Date)
    rollover_enabled = Column(Boolean, default=False)

    user = relationship("User", back_populates="budgets")

class SavingsGoal(Base):
    __tablename__ = "savings_goals"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"))
    name = Column(String, nullable=False)
    target_amount = Column(Float, nullable=False)
    current_amount = Column(Float, default=0.0)
    deadline = Column(Date)

    user = relationship("User", back_populates="savings")

class Investment(Base):
    __tablename__ = "investments"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"))
    asset_type = Column(String, nullable=False) # STOCK, MUTUAL_FUND, CRYPTO, etc.
    symbol = Column(String, nullable=False)
    units = Column(Float, nullable=False)
    purchase_price = Column(Float, nullable=False)
    current_value = Column(Float, nullable=False)
    buy_date = Column(Date)

    user = relationship("User", back_populates="investments")

class Liability(Base):
    __tablename__ = "liabilities"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"))
    type = Column(String, nullable=False) # e.g. Credit Cards, Loans
    provider = Column(String, nullable=False)
    owed = Column(Float, nullable=False, default=0.0)
    emi = Column(Float, default=0.0)
    interest_rate = Column(Float, default=0.0)
    due_date = Column(Date)

    user = relationship("User", back_populates="liabilities")

def init_db():
    Base.metadata.create_all(bind=engine)

