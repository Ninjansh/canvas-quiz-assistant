import os
import pathlib
import asyncio
import time
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from google import genai
from google.genai import types

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = genai.Client()

# Locate lecture slides folder
current_dir = pathlib.Path(__file__).resolve().parent
source_dir = current_dir / "Operating System"  # Make sure this matches your folder name

pdf_paths = [
    p for p in source_dir.iterdir()
    if p.is_file() and p.suffix.lower() == ".pdf"
] if source_dir.exists() else []

print(f"[*] Found {len(pdf_paths)} slide decks in {source_dir.name}")
uploaded_files = []
for path in sorted(pdf_paths):
    print(f"[*] Uploading {path.name} to Gemini context...")
    f = client.files.upload(file=str(path))
    uploaded_files.append(f)
    print(f"[✓] Active source: {path.name}")

print(f"[✓] Successfully mounted {len(uploaded_files)} source files.")

class QuestionRequest(BaseModel):
    question: str
    options: list[str] = []

api_lock = asyncio.Lock()
last_call_time = 0.0

@app.post("/solve")
async def solve_question(req: QuestionRequest):
    global last_call_time

    async with api_lock:
        now = time.time()
        elapsed = now - last_call_time
        if elapsed < 7.0:
            await asyncio.sleep(7.0 - elapsed)

        system_instruction = (
            "You are an automated, high-precision academic exam solver. "
            "Rely strictly on the provided course lecture slides to answer the question. "
            "Respond ONLY with the EXACT verbatim text of the single correct answer option. "
            "Do not provide explanations, choice letters, or greetings."
        )

        prompt = f"Question:\n{req.question}\n\nOptions:\n" + "\n".join(f"- {opt}" for opt in req.options)

        config = types.GenerateContentConfig(
            system_instruction=system_instruction,
            temperature=0.0,
        )

        # PASS UPLOADED SLIDES DIRECTLY INTO CONTENTS
        contents = [*uploaded_files, prompt]

        max_retries = 3
        for attempt in range(max_retries):
            try:
                print(f"[*] Consulting slides for: {req.question[:45]}...")
                response = client.models.generate_content(
                    model="gemini-3.5-flash-lite",
                    contents=contents,
                    config=config,
                )
                last_call_time = time.time()
                return {"answer": response.text.strip()}

            except Exception as err:
                err_str = str(err)
                if "429" in err_str or "RESOURCE_EXHAUSTED" in err_str:
                    print(f"[!] Quota pause: waiting 18s (Attempt {attempt + 1}/{max_retries})...")
                    await asyncio.sleep(18)
                elif "503" in err_str or "UNAVAILABLE" in err_str:
                    await asyncio.sleep(4)
                else:
                    print(f"[!] API Error: {err}")
                    return {"answer": f"Error: {err}"}

        return {"answer": "Error: Quota limit exceeded"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)