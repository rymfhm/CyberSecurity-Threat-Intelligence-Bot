#  Gemini API Key Setup Guide

## Quick Setup Instructions

### Step 1: Get Your Gemini API Key

1. **Visit Google AI Studio**: [https://aistudio.google.com/](https://aistudio.google.com/)
2. **Sign in** with your Google account
3. **Click "Get API key"** in the left sidebar
4. **Create API key** (you can create a new Google Cloud project or use an existing one)
5. **Copy your API key** (it will look like: `AIzaSy...`)

### Step 2: Add API Key to Your Project

1. **Navigate to your project folder**:
   ```bash
   cd C:\Users\Royem\Documents\CTIB
   ```

2. **Create or edit the `.env` file**:
   - If you don't have a `.env` file, copy the example:
     ```bash
     copy env.example .env
     ```
   - On Linux/Mac:
     ```bash
     cp env.example .env
     ```

3. **Open `.env` in a text editor** and add your API key:

   ```env
   GEMINI_API_KEY=AIzaSyYourActualApiKeyHere
   ```

   **Replace `AIzaSyYourActualApiKeyHere` with your actual API key from Step 1.**

4. **Save the file**

### Step 3: Verify Setup

Your `.env` file should look like this:

```env
# Gemini Configuration
GEMINI_API_KEY=AIzaSyYourActualApiKeyHere
GEMINI_MODEL=gemini-1.5-flash
GEMINI_EMBEDDING_MODEL=text-embedding-004

# ChromaDB Configuration (optional)
CHROMADB_URL=http://localhost:8000
CHROMADB_COLLECTION_NAME=threat_intelligence

# Application Configuration
NODE_ENV=development
PORT=3000

# NVD API Configuration (optional)
NVD_API_KEY=
```

### Step 4: Install Dependencies

If you haven't already, install the required packages:

```bash
npm install
```

This will install the `@google/generative-ai` package needed for Gemini.

### Step 5: Restart Your Development Server

If your development server is running, restart it to load the new environment variables:

1. Stop the server (Ctrl+C)
2. Start it again:
   ```bash
   npm run dev
   ```

## Important Notes

-  **Never commit your `.env` file** - it's already in `.gitignore`
-  **Keep your API key secret** - don't share it publicly
-  **Free tier available** - Gemini offers generous free tier limits
-  **API key format** - Should start with `AIzaSy...`

## Troubleshooting

### "GEMINI_API_KEY environment variable is required"

- Make sure the `.env` file exists in the project root
- Check that the variable name is exactly `GEMINI_API_KEY` (no typos)
- Verify the API key is on the same line (no line breaks)
- Restart your development server after making changes

### "Invalid API key" error

- Verify you copied the full API key (should be quite long, starting with `AIzaSy`)
- Check that there are no extra spaces or quotes around the key
- Make sure you're using a valid key from [aistudio.google.com](https://aistudio.google.com/)

## Next Steps

After setting up your API key:

1. **Test the setup**: Run `npm run dev` and check the console for errors
2. **Ingest data**: Run `npm run ingest` to fetch and index CVE data
3. **Start chatting**: Visit http://localhost:3000 and ask questions!

---

**Your API key location**: `.env` file in the project root (`C:\Users\Royem\Documents\CTIB\.env`)





