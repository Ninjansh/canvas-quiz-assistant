# Canvas Quiz Assistant

An automated quiz assistant that pairs a lightweight Chrome extension with a local FastAPI backend powered by Google Gemini. Grounded in uploaded lecture slides for high precision and supports cross-language answer matching.

## Project Structure
- `Server/`: FastAPI backend handling document mounting and Gemini API calls.
- `extension/`: Chrome extension content scripts for DOM parsing and subtle answer hints.

## Setup Instructions

### 1. Backend Setup
1. Create and activate a virtual environment:
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Set your Gemini API key:
   ```bash
   export GEMINI_API_KEY="your_api_key_here"
   ```
4. Place your lecture slide PDFs into your server slide directory and launch:
   ```bash
   python Server/app.py
   ```

### 2. Chrome Extension Setup
1. Open Google Chrome and go to `chrome://extensions/`.
2. Enable Developer mode (toggle in top-right corner).
3. Click Load unpacked and select the `extension/` directory.

## Disclaimer
This project is built for educational and research purposes. Please adhere to your institution's academic integrity policies.
