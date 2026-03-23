import os
import json
from typing import TypedDict, Annotated, Literal
from langgraph.graph import StateGraph, START, END
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage, BaseMessage
from dotenv import load_dotenv
import operator

load_dotenv()

llm = ChatOpenAI(
    model="gpt-4o-mini",
    api_key=os.getenv("OPENAI_API_KEY"),
)

# ═══════════════════════════════════════════════════════════════
# General Voice Assistant (existing)
# ═══════════════════════════════════════════════════════════════

class AgentState(TypedDict):
    messages: Annotated[list[BaseMessage], operator.add]
    user_input: str
    response: str

def llm_node(state: AgentState) -> AgentState:
    messages = [
        SystemMessage(content="You are a helpful voice assistant. Keep responses short and conversational."),
        HumanMessage(content=state["user_input"]),
    ]
    result = llm.invoke(messages)
    return {"messages": [result], "response": result.content, "user_input": state["user_input"]}

def build_agent_graph():
    graph = StateGraph(AgentState)
    graph.add_node("llm", llm_node)
    graph.add_edge(START, "llm")
    graph.add_edge("llm", END)
    return graph.compile()

agent = build_agent_graph()

async def run_agent(user_text: str) -> str:
    result = await agent.ainvoke({"user_input": user_text, "messages": [], "response": ""})
    return result["response"]


# ═══════════════════════════════════════════════════════════════
# Mock Interview Graph
# ═══════════════════════════════════════════════════════════════

INTERVIEW_CONFIGS = {
    "fullstack": {
        "title": "Full Stack Developer",
        "system_prompt": (
            "You are an expert technical interviewer for Full Stack Developer positions. "
            "You interview candidates on: React, Next.js, Node.js, REST APIs, databases (SQL/NoSQL), "
            "system design, authentication, deployment, Git, and problem-solving. "
            "Ask clear, specific, real-world interview questions. Mix behavioral and technical."
        ),
    },
    "ml": {
        "title": "ML Engineer",
        "system_prompt": (
            "You are an expert technical interviewer for Machine Learning Engineer positions. "
            "You interview candidates on: supervised/unsupervised learning, neural networks, "
            "CNNs, RNNs, transformers, NLP, feature engineering, model evaluation, MLOps, "
            "Python, PyTorch/TensorFlow, and ML system design. "
            "Ask clear, specific, real-world interview questions. Mix behavioral and technical."
        ),
    },
    "devops": {
        "title": "DevOps Engineer",
        "system_prompt": (
            "You are an expert technical interviewer for DevOps Engineer positions. "
            "You interview candidates on: CI/CD pipelines, Docker, Kubernetes, cloud platforms (AWS/GCP/Azure), "
            "Infrastructure as Code (Terraform/Ansible), networking, monitoring, observability, and Linux troubleshooting. "
            "Ask clear, specific, real-world interview questions. Mix behavioral and technical."
        ),
    },
}


class InterviewState(TypedDict):
    interview_type: str           # "fullstack" | "ml"
    phase: str                    # "init" | "answering"
    questions: list[str]          # 10 generated questions
    current_q_index: int          # 0-9
    answers: list[dict]           # [{question, answer, score, feedback}]
    user_input: str               # current user answer
    response: str                 # AI's spoken response to send
    is_complete: bool             # true when all 10 done
    final_score: int              # overall /100
    final_feedback: str           # summary feedback


# --- Nodes ---

def generate_questions(state: InterviewState) -> dict:
    """Generate 10 interview questions for the selected role."""
    config = INTERVIEW_CONFIGS[state["interview_type"]]
    
    result = llm.invoke([
        SystemMessage(content=config["system_prompt"]),
        HumanMessage(content=(
            "Generate exactly 10 interview questions for this role. "
            "Mix technical and behavioral questions. "
            "Return them as a JSON array of strings. "
            "Example: [\"Question 1?\", \"Question 2?\", ...] "
            "Return ONLY the JSON array, no other text."
        )),
    ])
    
    # Parse the JSON array from LLM response
    try:
        questions = json.loads(result.content.strip())
        if not isinstance(questions, list) or len(questions) < 10:
            raise ValueError("Not enough questions")
        questions = questions[:10]
    except (json.JSONDecodeError, ValueError):
        # Fallback: split by newlines
        lines = [l.strip().lstrip("0123456789.-) ") for l in result.content.strip().split("\n") if l.strip()]
        questions = [q for q in lines if q.endswith("?")][:10]
        while len(questions) < 10:
            questions.append("Can you tell me about a challenging project you worked on?")
    
    return {"questions": questions}


def ask_question(state: InterviewState) -> dict:
    """Format the current question as a natural spoken prompt."""
    idx = state["current_q_index"]
    question = state["questions"][idx]
    config = INTERVIEW_CONFIGS[state["interview_type"]]
    
    if idx == 0:
        response = (
            f"Welcome to your {config['title']} mock interview. "
            f"I'll ask you 10 questions. Take your time and answer naturally. "
            f"Here's your first question. {question}"
        )
    else:
        response = f"Question {idx + 1} of 10. {question}"
    
    return {"response": response}


def evaluate_answer(state: InterviewState) -> dict:
    """Evaluate the user's answer, score it, and store the result."""
    idx = state["current_q_index"]
    question = state["questions"][idx]
    answer = state["user_input"]
    config = INTERVIEW_CONFIGS[state["interview_type"]]
    
    result = llm.invoke([
        SystemMessage(content=(
            f"{config['system_prompt']} "
            "You are now evaluating a candidate's answer. "
            "Score it from 1 to 10. Be fair but strict. "
            "Return ONLY valid JSON: {\"score\": <number>, \"feedback\": \"<one sentence>\"}"
        )),
        HumanMessage(content=f"Question: {question}\nCandidate's Answer: {answer}"),
    ])
    
    try:
        evaluation = json.loads(result.content.strip())
        score = int(evaluation.get("score", 5))
        feedback = evaluation.get("feedback", "")
    except (json.JSONDecodeError, ValueError):
        score = 5
        feedback = "Decent attempt."
    
    # Store this answer
    new_answer = {
        "question": question,
        "answer": answer,
        "score": score,
        "feedback": feedback,
    }
    
    updated_answers = state.get("answers", []) + [new_answer]
    next_index = idx + 1
    is_complete = next_index >= 10
    
    return {
        "answers": updated_answers,
        "current_q_index": next_index,
        "is_complete": is_complete,
    }


def ask_next_question(state: InterviewState) -> dict:
    """After evaluating, acknowledge and ask the next question."""
    last_answer = state["answers"][-1]
    idx = state["current_q_index"]  # Already incremented by evaluate_answer
    question = state["questions"][idx]
    
    response = (
        f"{last_answer['feedback']} "
        f"Moving on. Question {idx + 1} of 10. {question}"
    )
    
    return {"response": response}


def generate_report(state: InterviewState) -> dict:
    """Generate final score and comprehensive feedback."""
    answers = state["answers"]
    config = INTERVIEW_CONFIGS[state["interview_type"]]
    
    # Calculate average score
    total = sum(a["score"] for a in answers)
    final_score = int((total / (len(answers) * 10)) * 100)
    
    # Build summary for LLM
    summary = "\n".join(
        f"Q: {a['question']}\nA: {a['answer']}\nScore: {a['score']}/10"
        for a in answers
    )
    
    result = llm.invoke([
        SystemMessage(content=(
            f"{config['system_prompt']} "
            "You are now giving final feedback after a complete mock interview. "
            "Be encouraging but honest. Keep it to 3-4 sentences spoken naturally."
        )),
        HumanMessage(content=(
            f"Here's the complete interview performance:\n{summary}\n\n"
            f"Overall score: {final_score}/100. "
            "Give a brief, spoken summary of their performance, strengths, and areas to improve."
        )),
    ])
    
    response = (
        f"That completes your interview! Your overall score is {final_score} out of 100. "
        f"{result.content}"
    )
    
    return {
        "response": response,
        "final_score": final_score,
        "final_feedback": result.content,
        "is_complete": True,
    }


# --- Router ---

def route_by_phase(state: InterviewState) -> str:
    if state["phase"] == "init":
        return "generate_questions"
    return "evaluate_answer"

def route_after_eval(state: InterviewState) -> str:
    if state.get("is_complete", False):
        return "generate_report"
    return "ask_next_question"


# --- Build Graph ---

def build_interview_graph():
    graph = StateGraph(InterviewState)
    
    # Add nodes
    graph.add_node("generate_questions", generate_questions)
    graph.add_node("ask_question", ask_question)
    graph.add_node("evaluate_answer", evaluate_answer)
    graph.add_node("ask_next_question", ask_next_question)
    graph.add_node("generate_report", generate_report)
    
    # Entry: route by phase
    graph.add_conditional_edges(START, route_by_phase, {
        "generate_questions": "generate_questions",
        "evaluate_answer": "evaluate_answer",
    })
    
    # After generating questions → ask first question
    graph.add_edge("generate_questions", "ask_question")
    graph.add_edge("ask_question", END)
    
    # After evaluating → check if done
    graph.add_conditional_edges("evaluate_answer", route_after_eval, {
        "generate_report": "generate_report",
        "ask_next_question": "ask_next_question",
    })
    
    graph.add_edge("ask_next_question", END)
    graph.add_edge("generate_report", END)
    
    return graph.compile()


interview_graph = build_interview_graph()


async def run_interview(state: dict) -> dict:
    """Run the interview graph with the given state and return updated state."""
    result = await interview_graph.ainvoke(state)
    return result
