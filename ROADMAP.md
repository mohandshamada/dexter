# Dexter Fork: Enhancement Roadmap & Implementation Specs

This document outlines the architectural improvements and feature additions for the [Dexter](https://github.com/virattt/dexter) fork. It is designed to be used as a context file for AI coding assistants.

## 🎯 Strategic Goals
1.  **Persistence:** Enable long-running sessions and "resume" functionality.
2.  **Independence:** Decouple the data layer to support multiple providers (Yahoo Finance, Alpha Vantage).
3.  **Flexibility:** Support local models (Ollama) and aggregators (OpenRouter).
4.  **Efficiency:** Reduce latency and cost via caching.

---

## 🛠 Phase 1: Core Architecture & Persistence
**Goal:** Move from a single-session memory to a persistent database.

### 1.1 Add SQLite Database
**Context:** Currently, state is lost when the CLI closes. We need a lightweight local DB to store threads, plans, and research findings.
**Tech Stack:** `better-sqlite3` or `prisma` (with SQLite), TypeScript.

**Implementation Steps (Prompt for AI):**
> "Review the current state management. Install `better-sqlite3`. Create a `src/db` directory. Implement a schema to store:
> 1. `sessions`: (id, created_at, status)
> 2. `messages`: (id, session_id, role, content, timestamp)
> 3. `research_artifacts`: (id, session_id, data_json, source)
>
> Create a `DatabaseService` class that abstracts these operations. Update the main agent loop to save the 'Plan' and 'Final Answer' to this DB."

### 1.2 "Resume" Capability
**Context:** Users need to continue a research task after exiting.
**Implementation Steps (Prompt for AI):**
> "Modify the CLI entry point (`index.ts`). Add a startup flag `--resume <session_id>` or a menu command `Select previous session`. When selected, load the message history from SQLite into the LangChain memory before starting the agent loop."

---

## 🔌 Phase 2: Data Provider Abstraction
**Goal:** Remove the hard dependency on `financialdatasets.ai`.

### 2.1 The `FinancialProvider` Interface
**Context:** The agent currently calls specific API endpoints. We need an adapter pattern.
**Implementation Steps (Prompt for AI):**
> "Refactor the tool definitions. Create an interface `IFinancialProvider` in `src/interfaces/` with methods like:
> - `getBalanceSheet(ticker: string)`
> - `getIncomeStatement(ticker: string)`
> - `getPriceHistory(ticker: string)`
>
> Move the current logic into `FinancialDatasetsProvider`. Create a factory that initializes the provider based on `.env` configuration."

### 2.2 Add Yahoo Finance (Free Tier Support)
**Context:** Allow users to use the tool without a paid API key using scraping or free libs.
**Implementation Steps (Prompt for AI):**
> "Implement a `YahooFinanceProvider` that implements `IFinancialProvider`. Use the `yahoo-finance2` package to fetch data. Ensure the output format matches the strict schema expected by the 'Validator' agent so the rest of the app doesn't break."

---

## 🧠 Phase 3: Model Flexibility (LLMs)
**Goal:** Allow usage of cheaper or privacy-focused models.

### 3.1 OpenRouter & Local LLM Support
**Context:** Currently locked to OpenAI/Anthropic SDKs.
**Implementation Steps (Prompt for AI):**
> "Refactor the model initialization logic. Add support for an `OPENROUTER_API_KEY` in `.env`. Update the LangChain configuration to allow a base URL override.
>
> Add a configuration option for 'Local Mode' that points to `http://localhost:11434` (Ollama) and defaults to `llama3` or `mistral`. Ensure the System Prompt is adjusted for smaller models (make it less verbose)."

---

## ⚡ Phase 4: Performance & Cost
**Goal:** Stop wasting tokens on repeated queries.

### 4.1 Caching Layer
**Context:** The agent often verifies data by fetching it again.
**Implementation Steps (Prompt for AI):**
> "Implement a filesystem cache or an in-memory LRU cache for network requests. Before fetching data in `IFinancialProvider`, check if a file exists in `.cache/{ticker}_{dataType}_{date}.json`. If it exists and is less than 24 hours old, return the cached data instead of hitting the API."

### 4.2 Cost/Budget Guardrails
**Context:** Prevent infinite loops draining the wallet.
**Implementation Steps (Prompt for AI):**
> "Add a `MAX_STEPS` constant and a `MAX_COST` estimator. Tracking token usage in the main loop. If the session exceeds $1.00 (calculated via token counts), pause the agent and ask the user for permission to proceed."

---

## 📤 Phase 5: Usability & Output
**Goal:** Make the data usable outside the terminal.

### 5.1 Report Export
**Context:** Terminal output is hard to share.
**Implementation Steps (Prompt for AI):**
> "Add a final step to the 'Answer' agent. Once the final response is generated, verify if it contains financial tables. Use a template engine (like Handlebars or simple string replacement) to generate a `reports/{ticker}_analysis.md` file. Include the raw data tables and the agent's synthesis."

---

## 🚀 Bonus: MCP (Model Context Protocol) Support
**Context:** Make Dexter compatible with the MCP standard so it can be used *inside* Claude Desktop or other MCP clients.

### 6.1 MCP Server Implementation
**Implementation Steps (Prompt for AI):**
> "Create a new entry point `mcp-server.ts`. Use the `@modelcontextprotocol/sdk`. Expose the `IFinancialProvider` tools as MCP Resources and Tools. This will allow me to connect Dexter to my local Claude Desktop app as a server."
