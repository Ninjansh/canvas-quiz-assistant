# Canvas Quiz Assistant

An automated quiz assistant that pairs a lightweight Chrome extension with a local FastAPI backend powered by Google Gemini. Grounded in uploaded lecture slides for high precision and supports cross-language answer matching.

## Project Structure
- `Server/`: FastAPI backend handling document mounting and Gemini API calls.
  - `UploadFilesHere/`: Directory where lecture PDFs are placed for context grounding.
- `extension/`: Chrome extension content scripts for DOM parsing and subtle answer hints.

## Setup Instructions

### 1. Backend Setup
1. Create and activate a virtual environment:
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate