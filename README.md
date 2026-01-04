# Dexter 🤖

Dexter is an autonomous financial research agent that thinks, plans, and learns as it works. It performs analysis using task planning, self-reflection, and real-time market data. Think Claude Code, but built specifically for financial research.

## ✨ What's New

- **🔄 Session Persistence**: Save and resume research sessions with SQLite database
- **💰 Free Data Option**: Use Yahoo Finance as a free alternative to premium data
- **🤖 More LLM Options**: Support for OpenRouter (100+ models) and Ollama (local models)
- **⚡ Smart Caching**: 24-hour cache reduces API costs and speeds up research
- **📊 Session Management**: List and resume previous sessions with `/sessions` command


<img width="979" height="651" alt="Screenshot 2025-10-14 at 6 12 35 PM" src="https://github.com/user-attachments/assets/5a2859d4-53cf-4638-998a-15cef3c98038" />

## Overview

Dexter takes complex financial questions and turns them into clear, step-by-step research plans. It runs those tasks using live market data, checks its own work, and refines the results until it has a confident, data-backed answer.  

**Key Capabilities:**
- **Intelligent Task Planning**: Automatically decomposes complex queries into structured research steps
- **Autonomous Execution**: Selects and executes the right tools to gather financial data
- **Self-Validation**: Checks its own work and iterates until tasks are complete
- **Persistent Sessions**: Save and resume research sessions across CLI restarts
- **Real-Time Financial Data**: Access to income statements, balance sheets, and cash flow statements
- **Multiple Data Providers**: Choose between premium (FinancialDatasets) or free (Yahoo Finance) data sources
- **Flexible LLM Support**: Use OpenAI, Anthropic, Google, OpenRouter, or local models (Ollama)
- **Smart Caching**: Filesystem-based cache reduces API costs and improves performance
- **Safety Features**: Built-in loop detection and step limits to prevent runaway execution

[![Twitter Follow](https://img.shields.io/twitter/follow/virattt?style=social)](https://twitter.com/virattt)

<img width="996" height="639" alt="Screenshot 2025-11-22 at 1 45 07 PM" src="https://github.com/user-attachments/assets/8915fd70-82c9-4775-bdf9-78d5baf28a8a" />


### Prerequisites

**Required:**
- [Bun](https://bun.com) runtime (v1.0 or higher)
- At least one LLM API key:
  - OpenAI API key (get [here](https://platform.openai.com/api-keys))
  - OR Anthropic API key (get [here](https://console.anthropic.com/))
  - OR Google API key (get [here](https://ai.google.dev/))
  - OR OpenRouter API key (get [here](https://openrouter.ai/))
  - OR Ollama running locally (get [here](https://ollama.ai/))

**Optional:**
- Financial Datasets API key (get [here](https://financialdatasets.ai)) - premium data source
  - *Alternative: Use Yahoo Finance (free, no API key required)*
- Tavily API key (get [here](https://tavily.com)) - for web search capabilities

#### Installing Bun

If you don't have Bun installed, you can install it using curl:

**macOS/Linux:**
```bash
curl -fsSL https://bun.com/install | bash
```

**Windows:**
```bash
powershell -c "irm bun.sh/install.ps1|iex"
```

After installation, restart your terminal and verify Bun is installed:
```bash
bun --version
```

### Installing Dexter

1. Clone the repository:
```bash
git clone https://github.com/mohandshamada/dexter.git
cd dexter
```

2. Install dependencies with Bun:
```bash
bun install
```

3. Set up your environment variables:
```bash
# Copy the example environment file
cp env.example .env

# Edit .env and add your API keys
```

**Minimum configuration** (using free options):
```bash
# LLM Provider (choose one)
OPENAI_API_KEY=your-openai-api-key
# OR use local Ollama
OLLAMA_BASE_URL=http://localhost:11434/v1

# Financial Data Provider (Yahoo Finance is free, no API key needed)
FINANCIAL_PROVIDER=yahoo
```

**Full configuration** (all options):
```bash
# LLM API Keys (choose at least one)
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key
GOOGLE_API_KEY=your-google-api-key
OPENROUTER_API_KEY=your-openrouter-api-key
OLLAMA_BASE_URL=http://localhost:11434/v1

# Financial Data Provider
FINANCIAL_PROVIDER=financialdatasets  # or 'yahoo' for free alternative
FINANCIAL_DATASETS_API_KEY=your-financial-datasets-api-key

# Optional: Web Search
TAVILY_API_KEY=your-tavily-api-key

# Optional: Cache Control
DISABLE_CACHE=false  # Set to 'true' to disable caching
```

### Usage

**Basic usage** - Run Dexter in interactive mode:
```bash
bun start
```

**Development mode** - Run with watch mode for auto-reload:
```bash
bun dev
```

**Resume a previous session**:
```bash
bun start -- --resume <session-id>
```

### CLI Commands

While Dexter is running, you can use these special commands:

- `/model` - Switch between LLM providers (OpenAI, Anthropic, Google)
- `/sessions` - List your recent research sessions
- `/cache stats` - View cache statistics (entries, size, hit rate)
- `/cache clear` - Clear all cached data
- `/cache clean` - Remove only expired cache entries
- `exit` or `quit` - Exit the application

### Example Queries

Try asking Dexter questions like:
- "What was Apple's revenue growth over the last 4 quarters?"
- "Compare Microsoft and Google's operating margins for 2023"
- "Analyze Tesla's cash flow trends over the past year"
- "What is Amazon's debt-to-equity ratio based on recent financials?"

Dexter will automatically:
1. Break down your question into research tasks
2. Fetch the necessary financial data
3. Perform calculations and analysis
4. Provide a comprehensive, data-rich answer

## Architecture

Dexter uses a multi-agent architecture with specialized components:

- **Planning Agent**: Analyzes queries and creates structured task lists
- **Action Agent**: Selects appropriate tools and executes research steps
- **Validation Agent**: Verifies task completion and data sufficiency
- **Answer Agent**: Synthesizes findings into comprehensive responses

## Tech Stack

- **Runtime**: [Bun](https://bun.sh)
- **UI Framework**: [React](https://react.dev) + [Ink](https://github.com/vadimdemedes/ink) (terminal UI)
- **LLM Integration**: [LangChain.js](https://js.langchain.com) with multi-provider support
- **Database**: SQLite via [better-sqlite3](https://github.com/WiseLibs/better-sqlite3)
- **Financial Data**: Multiple providers (FinancialDatasets, Yahoo Finance)
- **Schema Validation**: [Zod](https://zod.dev)
- **Language**: TypeScript

## Features

### 🔄 Session Persistence

All your research sessions are automatically saved to a local SQLite database (`.dexter/dexter.db`). This includes:
- Conversation history
- Research plans and task execution
- Tool results and artifacts
- Reflection outcomes

Resume any previous session:
```bash
bun start -- --resume session_1234567890_abc123
```

List your sessions from within the CLI:
```
/sessions
```

### 💰 Multiple Financial Data Providers

Choose between different data sources based on your needs:

**FinancialDatasets** (Premium, API key required):
- Comprehensive financial data
- Historical statements
- Analyst estimates
- Insider trades

**Yahoo Finance** (Free, no API key):
- Basic financial statements
- Price data
- Key metrics
- Company news

Switch providers by setting `FINANCIAL_PROVIDER=yahoo` or `FINANCIAL_PROVIDER=financialdatasets` in your `.env` file.

### 🤖 Flexible LLM Support

Use any of these LLM providers:

**Built-in providers** (switch with `/model` command):
- GPT 4.1 (OpenAI)
- Claude Sonnet 4.5 (Anthropic)
- Gemini 3 (Google)

**OpenRouter** (100+ models):
```bash
# Use any OpenRouter model by prefixing with 'openrouter-'
# Example: openrouter-anthropic/claude-3-opus
```

**Ollama** (local models):
```bash
# Run models locally with the 'ollama-' prefix
# Example: ollama-llama3, ollama-mistral
OLLAMA_BASE_URL=http://localhost:11434/v1
```

### ⚡ Smart Caching

Dexter caches API responses for 24 hours to:
- Reduce API costs
- Improve response times
- Enable offline analysis of previously fetched data

Cache is stored in `.dexter/cache/` and can be managed with:
- `/cache stats` - View cache size and hit statistics
- `/cache clear` - Remove all cached data
- `/cache clean` - Remove only expired entries

Disable caching by setting `DISABLE_CACHE=true` in your `.env` file.

## How to Contribute

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

**Important**: Please keep your pull requests small and focused.  This will make it easier to review and merge.


## License

This project is licensed under the MIT License.

