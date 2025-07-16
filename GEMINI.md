# Gemini Project Context: another-life

This document provides essential context about the "another-life" project for the Gemini AI assistant.

## 1. Project Overview

"another-life" is a web application that appears to be a life simulation or role-playing game (RPG). Key features suggested by the code structure include character creation, attribute allocation, and a sophisticated event-driven system that likely forms the core of the gameplay mechanics.

The application is built using a modern frontend stack with React and Vite.

## 2. Tech Stack

- **Framework:** React 19
- **Language:** TypeScript and JavaScript (JSX)
- **Build Tool:** Vite
- **Testing (Unit/Integration):** Jest, React Testing Library
- **Testing (E2E):** The project can be tested with Playwright using the "mcp" test suite.
- **Linting:** ESLint
- **Styling:** Standard CSS (`.css` files)
- **State Management:** Likely relies on React's built-in state management hooks (`useState`, `useContext`), as no external state management library like Redux or Zustand is listed as a primary dependency.

## 3. Project Structure

The `src` directory is organized by feature and responsibility:

- `src/components`: Contains reusable React components, such as `CharacterCreationForm.tsx` and `ProfessionSelector.tsx`.
- `src/eventSystem`: This is a major module and likely contains the core game logic. It's built around an event-driven architecture with its own engine, loop, and type definitions.
- `src/types`: Centralized TypeScript type definitions for data models like `character.ts` and `eventLog.ts`.
- `src/utils`: Utility functions for concerns like data persistence (`persistence.ts`) and data model management.
- `src/__tests__`: Contains integration tests.
- `src/components/__tests__`: Unit and component tests are co-located with the components they test.

## 4. Scripts & Commands

Standard npm scripts are configured in `package.json`:

- **`npm run dev`**: Starts the Vite development server for local development.
- **`npm run build`**: Bundles the application for production.
- **`npm run lint`**: Runs ESLint to check for code quality and style issues.
- **`npm run test`**: Executes the test suite using Jest.
- **`npm run test:watch`**: Runs Jest in watch mode, re-running tests on file changes.

## 5. Coding Style & Conventions

- **React:** The project uses function components with hooks, as indicated by the file names and ESLint configuration for `eslint-plugin-react-hooks`.
- **TypeScript:** Strict mode is enabled in `tsconfig.json`, enforcing strong typing.
- **Testing:** Tests are written in TypeScript (`.test.tsx`, `.test.ts`) and follow a co-location strategy for unit tests and a centralized directory for integration tests.
- **Linting:** ESLint rules are defined in `eslint.config.js` to maintain code consistency.
