import requests


# for Ollama:
def call_llm(prompt: str) -> str:
    r = requests.post(
        "http://ollama:11434/api/generate",
        json={"model": "codellama:7b-instruct", "prompt": prompt, "stream": False},
    )
    print("LLM raw JSON:", r.json())  
    return r.json()["response"]
