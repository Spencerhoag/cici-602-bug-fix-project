import requests


# for Ollama:
def call_llm(prompt: str) -> str:
    r = requests.post(
        "http://ollama:11434/api/generate",
        json={
            "model": "codellama:7b-instruct",
            "prompt": prompt,
            "stream": False,
            "options": {
                "num_gpu": 0,  # Use CPU only to avoid GPU memory issues
                "num_ctx": 2048,  # Limit context window size
            }
        },
    )
    response_json = r.json()
    print("LLM raw JSON:", response_json)

    if "error" in response_json:
        raise RuntimeError(f"LLM API error: {response_json['error']}")

    return response_json["response"]
