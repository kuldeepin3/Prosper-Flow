import os
from dotenv import load_dotenv
load_dotenv()

from openai import OpenAI

# Initialize the OpenAI client pointing to the local Ollama server
# Using the OpenAI-compatible endpoint mapping provided by Ollama
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434/v1")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "ollama")

client = OpenAI(
    base_url=OLLAMA_BASE_URL,
    api_key=OPENAI_API_KEY
)

LLM_MODEL = os.getenv("LLM_MODEL", "llama3.1")
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "nomic-embed-text")
EMBEDDINGS_TIMEOUT = float(os.getenv("EMBEDDINGS_TIMEOUT", "10.0"))

import json
import re

agent_tools = [
    {
        "type": "function",
        "function": {
            "name": "update_budget",
            "description": "Create or update a monthly budget limit for a specific category (e.g. Food, Travel, Rent). Use this ONLY when the user explicitly requests to set, change, or lower their budget to a specific limit amount (e.g., 'set Food budget to 5000'). DO NOT call this tool for general questions about budgeting or queries like 'how is my budget'.",
            "parameters": {
                "type": "object",
                "properties": {
                    "category": {
                        "type": "string",
                        "description": "The category of the budget"
                    },
                    "limit_amount": {
                        "type": "number",
                        "description": "The monthly limit amount in INR"
                    }
                },
                "required": ["category", "limit_amount"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "create_savings_goal",
            "description": "Create a new progressive savings goal with a target amount. Use this ONLY when the user explicitly requests to establish a new savings target or goal with a specific target amount (e.g., 'create a goal of 10000 for a trip'). DO NOT invoke this for general advice on how to save money, questions like 'how can I save more?', or generic financial planning chats.",
            "parameters": {
                "type": "object",
                "properties": {
                    "name": {
                        "type": "string",
                        "description": "The name of the goal (e.g. Emergency Fund, Trip to Tokyo)"
                    },
                    "target_amount": {
                        "type": "number",
                        "description": "The target amount to save in INR"
                    },
                    "deadline": {
                        "type": "string",
                        "description": "Optional deadline date in YYYY-MM-DD format"
                    }
                },
                "required": ["name", "target_amount"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "create_transaction",
            "description": "Create and log a new transaction (Income or Expense) in the ledger. Use this ONLY when the user explicitly requests to log, add, or record a specific expense or income amount (e.g. 'log expense of 500 for coffee'). DO NOT invoke this for general questions about past transactions or general advice.",
            "parameters": {
                "type": "object",
                "properties": {
                    "amount": {
                        "type": "number",
                        "description": "The transaction amount in INR"
                    },
                    "type": {
                        "type": "string",
                        "enum": ["INCOME", "EXPENSE"],
                        "description": "Whether this is an INCOME (credit) or EXPENSE (debit)"
                    },
                    "category": {
                        "type": "string",
                        "description": "The category of the transaction (e.g. Food, Rent, Salary, Travel, Subscriptions, Entertainment)"
                    },
                    "description": {
                        "type": "string",
                        "description": "Brief description of the transaction"
                    },
                    "transaction_date": {
                        "type": "string",
                        "description": "Optional transaction date in YYYY-MM-DD format. Default is today's date."
                    }
                },
                "required": ["amount", "type", "category", "description"]
            }
        }
    }
]

def parse_text_tool_calls_fallback(content: str) -> list:
    """
    Fallback parser to extract tool calls from text if the LLM outputted them
    as text instead of structured fields.
    """
    tool_calls = []
    if not content:
        return tool_calls

    # Search for JSON blocks
    try:
        json_blocks = re.findall(r'```json\s*(.*?)\s*```', content, re.DOTALL)
        for block in json_blocks:
            parsed = json.loads(block.strip())
            if isinstance(parsed, dict) and "name" in parsed:
                tool_calls.append({
                    "function": {
                        "name": parsed["name"],
                        "arguments": json.dumps(parsed.get("arguments", {}))
                    }
                })
            elif isinstance(parsed, list):
                for item in parsed:
                    if isinstance(item, dict) and "name" in item:
                        tool_calls.append({
                            "function": {
                                "name": item["name"],
                                "arguments": json.dumps(item.get("arguments", {}))
                            }
                        })
    except Exception:
        pass

    # Search for custom pattern: [CALL: name(arguments)]
    # e.g., [CALL: update_budget(category="Food", limit_amount=5000)]
    pattern = re.compile(r'\[CALL:\s*(\w+)\((.*?)\)\]', re.IGNORECASE)
    matches = pattern.findall(content)
    for name, args_str in matches:
        args = {}
        # Find key=value pairs, e.g., category="Food", limit_amount=5000
        arg_pairs = re.findall(r'(\w+)\s*=\s*(?:"([^"]*)"|\'([^\']*)\'|(\d+(?:\.\d+)?))', args_str)
        for key, val_d, val_s, val_n in arg_pairs:
            val = val_d or val_s or (float(val_n) if '.' in val_n else int(val_n) if val_n else None)
            args[key] = val

        tool_calls.append({
            "function": {
                "name": name,
                "arguments": json.dumps(args)
            }
        })

    return tool_calls

def get_llm_response(messages: list, temperature: float = 0.7, use_tools: bool = False) -> tuple:
    """
    Get a response from the local Ollama LLM, optionally enabling tool completions.
    Returns (response_content, tool_calls_list).
    """
    try:
        kwargs = {
            "model": LLM_MODEL,
            "messages": messages,
            "temperature": temperature,
        }
        if use_tools:
            kwargs["tools"] = agent_tools
            # Instruct the model via system message about the format if it fails to use native tool calling
            tool_instr = (
                "\n\nIf you decide to invoke a tool, use the native tool calling feature. "
                "If your client interface does not support native tool calling, output your tool call as a JSON block in your response using this schema: "
                "```json\n{\"name\": \"tool_name\", \"arguments\": {\"param1\": \"val1\"}}\n```\n"
                "or write it as `[CALL: tool_name(param1=val1)]`."
            )
            for m in messages:
                if m.get("role") == "system":
                    m["content"] = m["content"] + tool_instr
                    break

        response = client.chat.completions.create(**kwargs)
        message = response.choices[0].message
        content = message.content or ""
        
        tool_calls = []
        if hasattr(message, 'tool_calls') and message.tool_calls:
            for tc in message.tool_calls:
                tool_calls.append({
                    "function": {
                        "name": tc.function.name,
                        "arguments": tc.function.arguments
                    }
                })
        
        # If no native tool calls, run the fallback parser on the text content
        if not tool_calls:
            tool_calls = parse_text_tool_calls_fallback(content)

        return content, tool_calls
    except Exception as e:
        print(f"Error calling LLM: {e}")
        return "", []

import json
import numpy as np

def get_embeddings(text: str) -> list:
    """
    Get vector embeddings from the local Ollama model.
    """
    # Groq does not support embeddings; skip to avoid log pollution
    if "groq.com" in str(client.base_url):
        return []
    try:
        response = client.embeddings.create(
            model=EMBEDDING_MODEL,
            input=text,
            timeout=EMBEDDINGS_TIMEOUT
        )
        return response.data[0].embedding
    except Exception as e:
        print(f"Error generating embeddings: {e}")
        return []

def calculate_cosine_similarity(vec1: list, vec2: list) -> float:
    """Calculate cosine similarity between two vectors using numpy."""
    if not vec1 or not vec2:
        return 0.0
    v1 = np.array(vec1)
    v2 = np.array(vec2)
    norm1 = np.linalg.norm(v1)
    norm2 = np.linalg.norm(v2)
    if norm1 == 0 or norm2 == 0:
        return 0.0
    return float(np.dot(v1, v2) / (norm1 * norm2))

def retrieve_relevant_transactions(query_embedding: list, transactions: list, top_k: int = 5) -> list:
    """
    Given a query embedding and a list of SQLAlchemy Transaction objects,
    returns the top_k most relevant transactions based on cosine similarity.
    """
    scored_transactions = []
    for tx in transactions:
        if not tx.embedding_json:
            continue
        try:
            tx_embedding = json.loads(tx.embedding_json)
            score = calculate_cosine_similarity(query_embedding, tx_embedding)
            scored_transactions.append((score, tx))
        except Exception as e:
            print(f"Error parsing embedding for transaction {tx.id}: {e}")
            continue
            
    # Sort by score descending
    scored_transactions.sort(key=lambda x: x[0], reverse=True)
    return [tx for score, tx in scored_transactions[:top_k]]
