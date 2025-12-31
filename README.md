# Cybersecurity Threat Intelligence RAG Bot

A full-stack TypeScript application that acts as a Cybersecurity Threat Intelligence Bot using Retrieval-Augmented Generation (RAG) and multi-agent orchestration.

## Features

- **CVE Ingestion**: Fetches and processes CVE data from NVD JSON feeds
- **Document Enrichment**: LLM-based enrichment to add tags, threat types, and metadata
- **Vector Search**: Semantic search using ChromaDB and OpenAI embeddings
- **RAG Chat Interface**: Ask questions about cybersecurity threats with source citations
- **Multi-Agent Architecture**: Modular agent system for ingestion, enrichment, indexing, and analysis

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Vector DB**: ChromaDB
- **LLM**: OpenAI (GPT-4o-mini, text-embedding-3-small)
- **Package Manager**: npm/pnpm

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   # or
   pnpm install
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env and add your OPENAI_API_KEY
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

4. **Ingest data** (optional):
   ```bash
   npm run ingest
   ```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run ingest` - Run ingestion pipeline (CVE fetch + enrichment + indexing)
- `npm run lint` - Run ESLint
- `npm run type-check` - Type check without emitting

## API Endpoints

- `POST /api/ask` - Ask a question about threat intelligence
- `POST /api/reindex` - Trigger ingestion and reindexing
- `GET /api/health` - Health check

## Architecture

The application uses a multi-agent architecture:

- **IngestionAgent**: Fetches CVE data from NVD
- **EnrichmentAgent**: Enriches documents using LLM
- **IndexingAgent**: Chunks documents and indexes them in ChromaDB
- **AnalystAssistantAgent**: Handles user queries with RAG

## Project Structure

```
src/
  agents/          # Agent implementations
  lib/             # Core libraries (vector store, LLM client)
  types/           # TypeScript types and interfaces
  api/             # Next.js API routes
  app/             # Next.js app directory (frontend)
  scripts/         # Utility scripts (ingestion pipeline)
```



