Canvas Quiz Assistant

An automated quiz assistant that pairs a discreet Chrome extension with a local FastAPI backend powered by Google Gemini. The system mounts course lecture slides into the model context for grounded accuracy and supports cross-language/auto-translated Canvas quiz environments.

Features

PDF-Grounded Answers: Feeds course lecture decks straight into Gemini's context window.

Multilingual Support: Handles English, Korean (참/거짓, O/X), and Chrome auto-translations (such as really / untruth).

Discreet UI Indicators: Displays a subtle grey loading status dot next to the question title and a single small green dot next to the predicted answer.

Rate-Limit Safe: Includes built-in pacing delays between questions to avoid hitting API rate limits or triggering anti-bot flags.

Project Structure

├── Server/
│   ├── app.py                # FastAPI backend & Gemini integration
│   ├── requirements.txt      # Python dependencies
│   └── UploadFilesHere/      # Directory for course lecture PDFs (tracked via .gitkeep)
├── extension/
│   ├── manifest.json         # Chrome Manifest v3 config
│   └── content.js            # Canvas DOM parser & dot injector
├── .gitignore                # Excludes .venv, .env, and *.pdf
└── README.md


Setup Instructions

1. Backend Setup

Step 1: Open Terminal in Project Root

Navigate to the root directory where the project was cloned:

cd "Ai solver"


Step 2: Create and Activate Virtual Environment

macOS / Linux:

python3 -m venv .venv
source .venv/bin/activate


Windows:

python -m venv .venv
.venv\Scripts\activate


Step 3: Install Dependencies

pip install fastapi uvicorn google-genai pydantic


(Or install directly from requirements if available: pip install -r Server/requirements.txt)

Step 4: Configure Gemini API Key

Get an API key from Google AI Studio.

Export the environment variable in your terminal session before launching the server:

macOS / Linux:

export GEMINI_API_KEY="your_api_key_here"


Windows (Command Prompt):

set GEMINI_API_KEY="your_api_key_here"


Windows (PowerShell):

$env:GEMINI_API_KEY="your_api_key_here"


Step 5: Add Lecture Slides

Place your course lecture slide files directly into:

Server/UploadFilesHere/


Ensure file names end with .pdf.

Step 6: Start the Backend Server

Run the application from the root directory:

python Server/app.py


Look for the startup log confirming mounted slides and active endpoint:

[*] Found 2 slide decks in UploadFilesHere
[*] Uploading OS05-Scheduling2.pdf to Gemini context...
[✓] Active source: OS05-Scheduling2.pdf
[*] Uploading OS06-Memory.pdf to Gemini context...
[✓] Active source: OS06-Memory.pdf
[✓] Successfully mounted 2 source files.
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)


2. Chrome Extension Installation

Step 1: Open Extensions Settings

Open Google Chrome and enter this address in the URL bar:

chrome://extensions/


Step 2: Enable Developer Mode

Turn on the Developer mode toggle in the top-right corner.

Step 3: Load Extension

Click Load unpacked in the top-left corner and select the extension/ directory from this repository.

Step 4: Allow File URLs (Optional for Local Testing)

If testing against local HTML mock files:

Click Details on the Canvas Quiz Assistant card.

Enable the toggle for Allow access to file URLs.

3. Usage & Verification

Step 1: Live Quiz Solving

Keep the FastAPI server active in your terminal.

Open your quiz in Canvas.

The extension scans the questions sequentially:

A grey indicator dot appears next to the question title while Gemini processes the query.

Once resolved, a small green indicator dot renders beside the matching answer choice.

Step 2: Testing the Backend via cURL

In a separate terminal window, send a sample request to verify communication:

curl -X POST http://127.0.0.1:8000/solve \
  -H "Content-Type: application/json" \
  -d '{"question": "In stride scheduling, does a process with more tickets have a smaller stride value?", "options": ["really", "untruth"]}'


Expected JSON response:

{"answer": "really"}


Security & Privacy Note

The .gitignore file prevents commits of .venv/, .env, and *.pdf lecture materials.

Never commit actual API credentials or proprietary course content to public repositories.