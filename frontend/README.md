# Frontend

An Angular frontend dashboard for error tracking and monitoring, built with Angular Materials and Chart.js.

## Prerequisites

Before you begin, ensure you have the following installed:

### Required Software

- **Node.js**: `^18.19.0` or `^20.11.0` or `^22.0.0`
- **npm**: `^9.0.0` or higher (comes with Node.js)
- **Angular CLI**: `^20.3.4`

### Recommended Versions

- **Node.js**: `20.11.0` or later (LTS version)
- **npm**: `10.x` or later
- **Angular CLI**: `20.3.4`

## Installation

1. Install project dependencies:
   ```bash
   npm install
   ```

## Running the Application

You can start the development server using either of these commands:

### Using npm:
```bash
npm start
```

### Using Angular CLI:
```bash
ng serve
```

The application will be available at `http://localhost:4200/`.

**Important:** For data to be presented in the dashboard, the backend server needs to be running. See the [backend README](../backend/README.md) for instructions on how to start the backend.

## Additional Commands

### Build
```bash
npm run build
```
Builds the project for production. Output files will be in the `dist/` directory.

## Architecture

This is an Angular 20 application built with modern architectural patterns:

### Core Technologies
- **Standalone components** - No NgModules, using the modern Angular approach
- **Angular Material UI** - Material Design components for consistent UI
- **RxJS** - Reactive programming for state management and async operations
- **Chart.js** - Data visualization for error statistics and trends
- **TypeScript** - Strict mode enabled for type safety

### Project Structure

```
src/
├── app/
│   ├── components/           # Standalone UI components
│   │   ├── error-events-list/      # Display error events in a table
│   │   ├── error-events-stats/     # Statistical dashboard with charts
│   │   ├── error-events-filter/    # Filter controls for error events
│   │   └── loading-spinner/        # Loading state indicator
│   ├── models/               # TypeScript interfaces and types
│   │   ├── error-event.model.ts
│   │   ├── error-events-response.model.ts
│   │   ├── error-events-stats.model.ts
│   │   ├── error-events-search-params.model.ts
│   │   └── pagination.model.ts
│   ├── services/             # Business logic and API communication
│   │   └── error-events.service.ts
│   └── app.ts                # Root component
├── environments/             # Environment-specific configuration
└── main.ts                   # Application entry point
```
