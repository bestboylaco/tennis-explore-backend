# TennisExplore – Phase 1 MVP
![Status](https://img.shields.io/badge/Status-Phase%201%20MVP-green)
![Node.js](https://img.shields.io/badge/Backend-Node.js-brightgreen)
![Qdrant](https://img.shields.io/badge/VectorDB-Qdrant-blue)
![MongoDB](https://img.shields.io/badge/Database-MongoDB-green)
AI-powered tennis performance intelligence platform developed in collaboration with Tennis Australia.

The platform explores how Retrieval-Augmented Generation (RAG), semantic search, and conversational AI can help coaches and performance staff retrieve information from multiple documents through a unified interface.

---

## Current MVP Features

- Document upload and ingestion
- Text extraction and preprocessing
- Document chunking and embedding generation
- Semantic retrieval using Qdrant
- AI-assisted question answering
- Retrieval-Augmented Generation (RAG)
- Web-based interaction interface
- Foundational coaching and analysis workflows




# TennisExplore – Phase 1 MVP

TennisExplore is a Phase 1 MVP prototype developed for Tennis Australia–QLD.  
The system explores how AI-assisted retrieval and chatbot interaction can help coaches and staff access tennis performance information from uploaded documents.
The .env file is not included in GitHub for security reasons.
Users must create their own .env file before running the project locally.
NOTE:
PORT=3000
MONGODB_URI=your_mongodb_connection_string
QDRANT_URL=http://localhost:6333
TEXT_MODEL=phi3
VISION_MODEL=llama3.2-vision:11b
## Current MVP Features

- Document upload and processing
- Text extraction and cleaning
- Chunking and embedding generation
- Vector search using Qdrant
- AI-assisted chatbot interaction
- Basic tennis knowledge retrieval
- Backend API for upload and chat workflows
- ## Current MVP Limitations

- The system is currently configured for local development.
- The prototype has not yet been deployed to a public production environment.
- Environment variables are required to connect to MongoDB, Qdrant, and local AI models.
- Some advanced performance intelligence features are planned for Phase 2.
- The MVP focuses on demonstrating document ingestion, retrieval, and AI-assisted querying.

## Repository Layout

```txt
## Repository Layout

```txt
tennis-explore-backend/

├── public/
│   └── demo.html
│       # Basic demonstration page for testing frontend interactions
│
├── routes/
│   ├── chatRoutes.js
│   │   # Main chatbot API endpoints
│   │   # Handles user questions and AI responses
│   │
│   ├── uploadRoutes.js
│   │   # Document upload endpoints
│   │   # Handles PDF, DOCX, TXT, and image uploads
│   │
│   └── imageRoutes.js
│       # Image analysis endpoints
│       # Connects vision models to frontend requests
│
├── services/
│   ├── aiService.js
│   │   # Core AI orchestration service
│   │   # Builds prompts and streams LLM responses
│   │
│   ├── coachingService.js
│   │   # Tennis-specific coaching logic
│   │   # Generates coaching insights and recommendations
│   │
│   ├── documentClassifierService.js
│   │   # Classifies uploaded documents by content type
│   │
│   ├── extractTextService.js
│   │   # Extracts text from PDF, DOCX, TXT and images
│   │
│   ├── hybridService.js
│   │   # Combines retrieval and reasoning workflows
│   │
│   ├── ingestionService.js
│   │   # Main document ingestion pipeline
│   │   # Upload → Extract → Chunk → Embed → Store
│   │
│   ├── journalProcessingService.js
│   │   # Processes research articles and long-form reports
│   │
│   ├── llmService.js
│   │   # Wrapper for language model communication
│   │
│   ├── processedRetrievalService.js
│   │   # Retrieves processed document chunks
│   │   # Builds context for AI responses
│   │
│   ├── processedStoreService.js
│   │   # Stores processed document metadata
│   │
│   ├── qdrantService.js
│   │   # Qdrant vector database operations
│   │   # Collection management and vector search
│   │
│   ├── reasoningService.js
│   │   # Structured reasoning and evidence analysis
│   │
│   ├── retrievalService.js
│   │   # Semantic search and chunk retrieval
│   │
│   ├── routerService.js
│   │   # Determines workflow routing
│   │   # Chatbot, retrieval, coaching, analysis
│   │
│   ├── s3Service.js
│   │   # AWS S3 file storage integration
│   │
│   ├── statsService.js
│   │   # Statistics and performance calculations
│   │
│   ├── visualService.js
│   │   # Visual and image analysis support
│   │
│   └── weaknessDetectionService.js
│       # Detects weaknesses and improvement opportunities
│       # From retrieved evidence
│
├── utils/
│   ├── chunker.js
│   │   # Splits documents into retrieval-sized chunks
│   │
│   ├── cleanText.js
│   │   # Cleans extracted text and removes noise
│   │
│   ├── embedding.js
│   │   # Generates vector embeddings
│   │
│   └── idGenerator.js
│       # Generates unique IDs for documents and chunks
│
├── .dockerignore
│   # Docker exclusion configuration
│
├── .gitignore
│   # Git exclusion configuration
│
├── Dockerfile
│   # Container configuration for deployment
│
├── index.js
│   # Application entry point
│   # Starts Express server and loads routes
│
├── package.json
│   # Project dependencies and scripts
│
├── package-lock.json
│   # Dependency version lock file
│
├── s3.js
│   # AWS S3 configuration
│
└── README.md
    # Project documentation and setup guide
```

## Current MVP Workflow

```txt
User uploads document
        ↓
Document Ingestion Pipeline
        ↓
Text Extraction
        ↓
Text Cleaning
        ↓
Document Chunking
        ↓
Embedding Generation
        ↓
Qdrant Vector Database
        ↓
User Question
        ↓
Semantic Retrieval
        ↓
Relevant Evidence
        ↓
Large Language Model
        ↓
AI Generated Response
```
