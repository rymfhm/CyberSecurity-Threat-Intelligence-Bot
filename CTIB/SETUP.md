# Cybersecurity Threat Intelligence RAG Bot - Setup & Architecture Guide

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Installation](#installation)
4. [Configuration](#configuration)
5. [Running the Application](#running-the-application)
6. [How It Works](#how-it-works)
7. [Architecture Deep Dive](#architecture-deep-dive)
8. [Usage Examples](#usage-examples)
9. [Troubleshooting](#troubleshooting)

---

## Overview

This is a **Cybersecurity Threat Intelligence Bot** built with TypeScript that uses:

- **RAG (Retrieval-Augmented Generation)**: Combines semantic search with LLM to provide accurate, source-grounded answers
- **Multi-Agent Architecture**: Modular agents handle ingestion, enrichment, indexing, and query processing
- **Vector Database**: ChromaDB for semantic similarity search
- **LLM Integration**: Google Gemini for embeddings and text generation

The bot can answer questions about CVEs, vulnerabilities, and threat intelligence by searching through ingested security data.

---

## Prerequisites

Before you begin, ensure you have the following installed:

### Required Software

1. **Node.js** (v18.0.0 or higher)
   - Download from [nodejs.org](https://nodejs.org/)
   - Verify installation: `node --version`

2. **npm** or **pnpm** (comes with Node.js)
   - Verify: `npm --version` or `pnpm --version`

3. **Gemini API Key**
   - Sign up at [aistudio.google.com](https://aistudio.google.com/)
   - Create an API key in your account settings (Get API key)
   - Free tier available with generous limits

### Optional (for ChromaDB server)

4. **Docker & Docker Compose** (optional)
   - Only needed if you want to run ChromaDB as a persistent server
   - Download from [docker.com](https://www.docker.com/)
   - The app works with in-memory ChromaDB by default

5. **NVD API Key** (optional but recommended)
   - Sign up at [nvd.nist.gov/developers/request-an-api-key](https://nvd.nist.gov/developers/request-an-api-key)
   - Free tier allows higher rate limits (50 requests per 30 seconds vs 5 without key)

---

## Installation

### Step 1: Clone or Navigate to Project Directory

```bash
cd C:\Users\Royem\Documents\CTIB
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install all required packages:
- Next.js (React framework)
- ChromaDB client
- Google Generative AI SDK
- TypeScript and development tools

**Expected time**: 2-5 minutes depending on your internet connection.

### Step 3: Configure Environment Variables

1. Copy the example environment file:
   ```bash
   copy env.example .env
   ```
   (On Linux/Mac: `cp env.example .env`)

2. Open `.env` in a text editor and fill in your values:

```env
# REQUIRED: Your Gemini API key
GEMINI_API_KEY=your_gemini_api_key_here

# Optional: Choose your models (defaults shown)
GEMINI_MODEL=gemini-2.0-flash
GEMINI_EMBEDDING_MODEL=text-embedding-004

# Optional: ChromaDB configuration (only if running Docker)
CHROMADB_URL=http://localhost:8000
CHROMADB_COLLECTION_NAME=threat_intelligence

# Optional: NVD API key for higher rate limits
NVD_API_KEY=your-nvd-api-key-here
```

**Important**: Never commit your `.env` file to version control. It's already in `.gitignore`.

---

## Configuration

### Gemini Models

You can customize which models to use:

- **GEMINI_MODEL**: The LLM for generating answers
  - Recommended: `gemini-2.0-flash` (latest, fast, cost-effective)
  - Alternative: `gemini-1.5-pro` (more capable, better for complex queries)
  - Alternative: `gemini-1.5-flash` (previous version, still available)

- **GEMINI_EMBEDDING_MODEL**: For generating embeddings
  - Recommended: `text-embedding-004` (Google's latest embedding model)
  - This is the standard embedding model for Gemini

### ChromaDB Setup (Optional)

**Option 1: In-Memory (Default)**
- No setup required
- Data is lost when the app restarts
- Good for development and testing

**Option 2: Persistent Server (Recommended for Production)**

1. Start ChromaDB with Docker:
   ```bash
   docker-compose up -d
   ```

2. Verify it's running:
   ```bash
   curl http://localhost:8000/api/v1/heartbeat
   ```

3. Update `.env`:
   ```env
   CHROMADB_URL=http://localhost:8000
   ```

---

## Running the Application

### Development Mode

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

3. You should see the chat interface.

### Ingest Data (First Time Setup)

Before you can ask questions, you need to ingest threat intelligence data:

1. **Open a new terminal** (keep the dev server running)

2. **Run the ingestion script**:
   ```bash
   npm run ingest
   ```

   Or specify how many days to fetch:
   ```bash
   npm run ingest 60
   ```
   (Fetches CVEs from the last 60 days)

**What happens during ingestion:**
- Fetches CVE data from NVD (National Vulnerability Database)
- Enriches each CVE with tags and threat types using LLM
- Chunks documents into smaller pieces
- Generates embeddings for each chunk
- Stores everything in ChromaDB

**Expected time**: 
- 30 days: ~5-15 minutes (depending on API rate limits)
- 60 days: ~10-30 minutes
- Without NVD API key: Slower due to rate limits (6 second delays)

**Note**: The first ingestion will take longer as it processes all CVEs. Subsequent ingestions only fetch new CVEs.

### Production Build

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Start production server**:
   ```bash
   npm start
   ```

---

## How It Works

### High-Level Flow

```
User Question
    ↓
AnalystAssistantAgent
    ↓
1. Generate query embedding
    ↓
2. Search ChromaDB (semantic similarity)
    ↓
3. Retrieve top N relevant chunks
    ↓
4. Build context from chunks
    ↓
5. Send to LLM with context
    ↓
6. Return answer + source citations
```

### Data Pipeline

```
NVD API (CVE Data)
    ↓
IngestionAgent
    ↓
Raw Threat Documents
    ↓
EnrichmentAgent (LLM)
    ↓
Enriched Documents (with tags, threat types)
    ↓
IndexingAgent
    ↓
1. Chunk documents
2. Generate embeddings
3. Store in ChromaDB
    ↓
Vector Database (Ready for Search)
```

### Query Processing

1. **User asks a question** (e.g., "What critical vulnerabilities affected Windows?")

2. **Query Embedding**: The question is converted to a vector using Gemini's embedding model

3. **Semantic Search**: ChromaDB finds the most similar document chunks using cosine similarity

4. **Context Building**: Top N chunks are assembled with metadata (CVE ID, severity, products, etc.)

5. **LLM Generation**: The LLM receives:
   - System prompt (defining the assistant's role)
   - User question
   - Retrieved context from vector search

6. **Response**: The LLM generates an answer grounded in the retrieved documents

7. **Source Citations**: The system returns the answer along with references (CVE IDs, URLs, titles)

---

## Architecture Deep Dive

### Multi-Agent System

The application uses a **modular agent architecture** inspired by CrewAI patterns:

#### 1. **IngestionAgent** (`src/agents/ingestion-agent.ts`)

**Responsibility**: Fetch raw threat intelligence data

**What it does**:
- Connects to NVD (National Vulnerability Database) API
- Fetches CVE data for a specified date range
- Parses CVE JSON responses
- Extracts: CVE ID, description, CVSS score, severity, vendors, products, CWE
- Converts to normalized `ThreatDocument` format

**Key Features**:
- Handles NVD API rate limits (6 second delays without API key)
- Pagination support for large date ranges
- Error handling and retries

#### 2. **EnrichmentAgent** (`src/agents/enrichment-agent.ts`)

**Responsibility**: Add intelligence to raw documents using LLM

**What it does**:
- Takes raw `ThreatDocument` objects
- Sends each document to Gemini with a specialized prompt
- LLM analyzes and adds:
  - **Tags**: e.g., `["rce", "privilege_escalation", "sql_injection"]`
  - **Threat Type**: e.g., "RCE", "Privilege Escalation", "DoS"
  - **Inferred Products**: Additional affected software not in original data
  - **Summary**: Brief 1-2 sentence summary

**Why it's important**: 
- Makes documents more searchable
- Adds semantic understanding
- Improves retrieval quality

#### 3. **IndexingAgent** (`src/agents/indexing-agent.ts`)

**Responsibility**: Prepare documents for vector search

**What it does**:
1. **Chunking**: Splits large documents into smaller chunks (1000 chars, 200 char overlap)
   - Why? Embeddings work better on smaller, focused text
   - Overlap ensures context isn't lost at boundaries

2. **Embedding Generation**: Converts each chunk to a vector using Gemini embeddings
   - Each chunk becomes a vector using Google's `text-embedding-004` model

3. **Vector Storage**: Stores chunks + embeddings + metadata in ChromaDB
   - Metadata includes: title, severity, products, tags, etc. (for filtering)

#### 4. **AnalystAssistantAgent** (`src/agents/analyst-assistant-agent.ts`)

**Responsibility**: Handle user queries with RAG

**What it does**:
1. Converts user question to embedding
2. Searches ChromaDB for similar chunks
3. Filters results (by severity, products, date range if specified)
4. Builds context string from top results
5. Sends to LLM with context
6. Extracts and formats source citations

**RAG Benefits**:
- Answers are **grounded** in actual data (not hallucinated)
- Provides **citations** (CVE IDs, URLs)
- Can answer questions about recent threats (not just training data)

### Vector Store Abstraction

The `VectorStore` interface (`src/types/vector-store.ts`) allows swapping vector databases:

- **Current Implementation**: ChromaDB (`src/lib/chroma-store.ts`)
- **Could be swapped for**: Qdrant, Pinecone, Weaviate, etc.

### Orchestration

`AgentOrchestrator` (`src/lib/agent-orchestrator.ts`) coordinates agents:

- Manages agent lifecycle
- Runs the full pipeline: `ingest → enrich → index`
- Provides singleton access to agents
- Handles initialization

---

## Usage Examples

### Example 1: Basic Question

**User**: "What critical vulnerabilities affected Windows Server 2019 in the last 30 days?"

**System Process**:
1. Generates embedding for the question
2. Searches ChromaDB for chunks mentioning "Windows Server 2019" and "critical"
3. Retrieves top 10 matching chunks
4. LLM synthesizes answer from context
5. Returns answer with CVE citations

**Expected Response**: 
- List of critical CVEs affecting Windows Server 2019
- Each with CVE ID, description, CVSS score
- Links to NVD pages

### Example 2: Specific CVE Query

**User**: "What are the mitigations for CVE-2024-12345?"

**System Process**:
1. Searches for chunks containing "CVE-2024-12345"
2. Retrieves all relevant chunks for that CVE
3. LLM extracts mitigation information from descriptions
4. Returns answer with source URL

### Example 3: Trend Analysis

**User**: "Summarize the main threat trends in the last month."

**System Process**:
1. Retrieves chunks from recent CVEs (filtered by date)
2. LLM analyzes patterns:
   - Most common threat types
   - Affected vendors/products
   - Severity distribution
3. Returns synthesized summary

### Example 4: Product-Specific Query

**User**: "What vulnerabilities affect Apache products?"

**System Process**:
1. Searches for chunks with "Apache" in products metadata
2. Retrieves relevant CVEs
3. LLM summarizes findings
4. Returns list with CVE IDs and descriptions

---

## API Endpoints

### POST `/api/ask`

Ask a question about threat intelligence.

**Request Body**:
```json
{
  "question": "What critical vulnerabilities affected Windows?",
  "maxResults": 10,
  "filters": {
    "severity": ["CRITICAL", "HIGH"],
    "products": ["Windows Server 2019"],
    "dateRange": {
      "start": "2024-01-01",
      "end": "2024-12-31"
    }
  }
}
```

**Response**:
```json
{
  "answer": "Based on the retrieved threat intelligence...",
  "sources": [
    {
      "id": "CVE-2024-12345",
      "title": "CVE-2024-12345: Remote Code Execution...",
      "sourceUrl": "https://nvd.nist.gov/vuln/detail/CVE-2024-12345",
      "score": 0.92
    }
  ]
}
```

### POST `/api/reindex`

Trigger reindexing (ingest + enrich + index).

**Request Body** (optional):
```json
{
  "days": 30
}
```

**Response**:
```json
{
  "message": "Reindexing started",
  "days": 30,
  "status": "processing"
}
```

**Note**: Reindexing runs asynchronously. Check logs for progress.

### GET `/api/health`

Health check endpoint.

**Response**:
```json
{
  "status": "healthy",
  "vectorStore": {
    "chunkCount": 1234
  },
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

---

## Troubleshooting

### Issue: "GEMINI_API_KEY environment variable is required"

**Solution**: 
- Make sure you created a `.env` file
- Verify the key is set: `GEMINI_API_KEY=your-actual-api-key-here`
- Restart the dev server after changing `.env`

### Issue: "Rate limited by NVD API"

**Solution**:
- Get a free NVD API key from [nvd.nist.gov](https://nvd.nist.gov/developers/request-an-api-key)
- Add it to `.env`: `NVD_API_KEY=your-key-here`
- The ingestion will be much faster (50 req/30s vs 5 req/30s)

### Issue: ChromaDB connection errors

**Solution**:
- If using Docker: `docker-compose up -d`
- If not using Docker: The app will fall back to in-memory mode (data won't persist)
- Check `CHROMADB_URL` in `.env` matches your setup

### Issue: "No relevant documents found"

**Solution**:
- Run ingestion first: `npm run ingest`
- Wait for ingestion to complete
- Try a broader question
- Check `/api/health` to see chunk count

### Issue: Slow responses

**Possible causes**:
- Large number of CVEs ingested (more chunks to search)
- Gemini API rate limits
- Network latency

**Solutions**:
- Reduce `maxResults` in queries
- Use faster models (`gemini-2.0-flash` instead of `gemini-1.5-pro`)
- Check Gemini API status

### Issue: TypeScript errors

**Solution**:
```bash
npm run type-check
```

Fix any type errors, or check `tsconfig.json` configuration.

### Issue: Build errors

**Solution**:
```bash
# Clean and reinstall
rm -rf node_modules .next
npm install
npm run build
```

---

## Project Structure

```
CTIB/
├── src/
│   ├── agents/              # Agent implementations
│   │   ├── ingestion-agent.ts
│   │   ├── enrichment-agent.ts
│   │   ├── indexing-agent.ts
│   │   └── analyst-assistant-agent.ts
│   ├── lib/                 # Core libraries
│   │   ├── gemini-client.ts
│   │   ├── chroma-store.ts
│   │   ├── text-chunker.ts
│   │   └── agent-orchestrator.ts
│   ├── types/               # TypeScript types
│   │   ├── document.ts
│   │   ├── agent.ts
│   │   └── vector-store.ts
│   ├── app/                 # Next.js app directory
│   │   ├── api/             # API routes
│   │   │   ├── ask/
│   │   │   ├── reindex/
│   │   │   └── health/
│   │   ├── page.tsx         # Frontend UI
│   │   ├── layout.tsx
│   │   └── globals.css
│   └── scripts/             # Utility scripts
│       └── ingest.ts        # Ingestion pipeline
├── package.json
├── tsconfig.json
├── next.config.js
├── docker-compose.yml       # ChromaDB server (optional)
├── .env                     # Your config (not in git)
├── env.example              # Example config
├── README.md
└── SETUP.md                 # This file
```

---

## Next Steps

### Customization Ideas

1. **Add more data sources**:
   - Vendor advisories (Microsoft, Cisco, etc.)
   - Security blog posts
   - Forum discussions

2. **Improve chunking**:
   - Adjust `chunkSize` and `chunkOverlap` in `TextChunker`
   - Use semantic chunking (split by meaning, not just size)

3. **Add filters**:
   - Filter by CWE category
   - Filter by vendor
   - Date range queries

4. **Enhance UI**:
   - Add filters in the frontend
   - Show CVE details in a modal
   - Export search results

5. **Performance**:
   - Add caching for common queries
   - Batch embedding generation
   - Use streaming responses

---

## Support & Resources

- **NVD API Docs**: [nvd.nist.gov/developers](https://nvd.nist.gov/developers)
- **Gemini API Docs**: [ai.google.dev/docs](https://ai.google.dev/docs)
- **ChromaDB Docs**: [docs.trychroma.com](https://docs.trychroma.com)
- **Next.js Docs**: [nextjs.org/docs](https://nextjs.org/docs)

---

## License

This is a thesis project. Use as needed for educational purposes.

---

**Happy Threat Hunting! 🛡️**


