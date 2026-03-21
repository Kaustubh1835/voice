import os
from typing import TypedDict, Annotated
from langgraph.graph import StateGraph, START, END
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage, BaseMessage
from dotenv import load_dotenv
import operator

load_dotenv()

# --- State ---
class AgentState(TypedDict):
    messages: Annotated[list[BaseMessage], operator.add]
    user_input: str
    response: str

# --- Nodes ---
def llm_node(state: AgentState) -> AgentState:
    """Call the LLM with the user's input and return a response."""
    llm = ChatOpenAI(
        model="gpt-4o-mini",
        api_key=os.getenv("OPENAI_API_KEY"),
    )

    messages = [
        SystemMessage(content="You are a helpful voice assistant. Keep responses short and conversational."),
        HumanMessage(content=state["user_input"]),
    ]

    result = llm.invoke(messages)

    return {
        "messages": [result],
        "response": result.content,
        "user_input": state["user_input"],
    }

# --- Graph ---
def build_graph():
    graph = StateGraph(AgentState)

    # Add nodes
    graph.add_node("llm", llm_node)

    # Add edges
    graph.add_edge(START, "llm")
    graph.add_edge("llm", END)

    return graph.compile()

# Compile once at module level
agent = build_graph()

async def run_agent(user_text: str) -> str:
    """Run the LangGraph agent with user input and return the AI response."""
    result = await agent.ainvoke({
        "user_input": user_text,
        "messages": [],
        "response": "",
    })
    return result["response"]
