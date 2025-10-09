# Error Tracking Backend

A Node.js/Express backend service for error tracking and monitoring, built with TypeScript and integrated with MongoDB, ElasticSearch, Redis, and Kafka.

## Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Node.js**: v18.x or higher (recommended: v20.x)
- **npm**: v9.x or higher (comes with Node.js)
- **Docker**: v24.x or higher
- **Docker Compose**: v2.x or higher

You can verify your installations with:

```bash
node --version
npm --version
docker --version
docker-compose --version
```

## Initial Setup

### 1. Environment Configuration

Create a `.env` file in the project root and copy the contents from `.env.example`:

```bash
cp .env.example .env
```

### 2. Install Dependencies

Install all required npm packages:

```bash
npm install
```

### 3. Code Validation

Run ESLint to validate the code:

```bash
npm run lint
```

### 4. Build the Project

Compile TypeScript to JavaScript:

```bash
npm run build
```

This will create a `build/` directory with the compiled JavaScript files.

## Running the Application

### Development Mode

Start the infrastructure services and run the application in development mode with hot-reload:

```bash
docker-compose up -d && npm run dev
```

This will:

- Start MongoDB, Elasticsearch, Redis, Kafka, and Zookeeper in Docker containers
- Run the application with nodemon, which watches for file changes and automatically restarts

### Production Mode

Start the infrastructure services and run the compiled production build:

```bash
docker-compose up -d && npm run start
```

This runs the compiled JavaScript from the `build/` directory.

### Initialize Databases (Optional)

The databases are automatically initialized with indexes and seed data when the application starts. However, you can manually run the setup script if needed:

```bash
npm run setup
```

## Running Tests

Execute the test suite with Jest:

```bash
npm run test
```

## Available Scripts

- `npm run dev` - Start development server with nodemon
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Run the compiled production build
- `npm test` - Run tests with Jest
- `npm run lint` - Validate code with ESLint
- `npm run setup` - Initialize databases and seed data

## Docker Services

The `docker-compose.yml` file provides the following infrastructure services:

- **MongoDB** (port 27017) - Document storage
- **Elasticsearch** (ports 9200) - Search and analytics
- **Redis** (port 6379) - Caching layer
- **Kafka** (port 9092) - Event streaming
- **Zookeeper** (port 2181) - Kafka coordination

## Architecture

The application follows a modular architecture:

```
src/
  api/            # API layer (routes, middlewares, controllers)
  config/         # Configuration management
  loaders/        # Application initialization
  models/         # Data models
  utils/          # Utility functions
  lib/            # Shared libraries
```

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express 5.x
- **Databases**: MongoDB, Elasticsearch, Redis
- **Message Queue**: Apache Kafka
- **Validation**: Zod
- **Testing**: Jest
