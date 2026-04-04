# Design Document: Contract Kit

Contract Kit is a Next.js-based web application with a design-to-implementation workflow.

## 1. Architectural Overview

### Frontend Architecture
- **Framework**: Next.js (App Router, Client Components).
- **Core State**: Managed using vanilla React `useState` and `useMemo` for high-performance reactive updates to code and YAML previews.
- **Components**: Atomic and modular approach:
  - `ApiGeneratorPage`: Main container for the API Import/Generator workspace.
  - `ProjectSetupCard`: Card-based UI for high-level project metadata.
  - `EndpointCard`: Represents a single endpoint with paths, methods, and schemas.
  - `SchemaTable`: Dynamic table for editing complex nested request/response objects.

### Data Model
- **EndpointContract**: The core entity representing a single REST endpoint. Includes path, method, annotations, and schema fields.
- **ProjectSetup**: Metadata for generating Java packages, classes, and base paths.
- **SchemaField**: Individual data points (name, type, sample value, comment).

### Logic Layer (`/lib`)
- `apiGenerator.ts`: Handles OpenAPI ingestion (parsing from text, proxying URLs) and generation (Angular/Spring Boot).
- `codegen.ts`: Logic for generating Java source code strings for Controllers and DTOs.
- `openapi.ts`: Logic for building valid OpenAPI 3.0.0 YAML/JSON documents from internal models.
- `types.ts`: TypeScript interfaces for the entire project.

---

## 2. UI/UX Design System

### Layout & Navigation
- **Responsive Layout**: A main workspace with a collapsible sidebar for version history and notifications.
- **Card-Based UI**: Individual sections (Project Setup, Endpoints, Testing) are contained in aesthetically pleasing white cards with soft shadows (`shadow-card`).
- **Workspace Navigation**: Top-level tabs for "Builder", "API Contract Builder", "History", and "Notifications".

### Aesthetics & Polish
- **Color Palette**:
  - Primary: Slate/Zinc (`bg-slate-900`, `text-slate-900`).
  - Highlights: Sky (Info), Emerald (Success), Amber (Warning/Description), Rose (Error).
  - Backgrounds: Clean whites (`bg-white`) and soft greys (`bg-slate-50`).
- **Typography**: Uses modern sans-serif stack (system fonts via Next/Tailwind) with clear visual hierarchy (H1, H2, H3, labels).
- **Interactions**:
  - Hover effects on cards and buttons.
  - Micro-animations for loading states (spinners) and notifications.
  - Syntax highlighting for code/YAML previews using custom CSS classes.

---

## 3. Technology Stack Choice Rationale
- **Next.js**: Provides the fastest developer experience for building robust, modern React applications with built-in routing.
- **Tailwind CSS**: Enables rapid UI development and ensures consistent design tokens without fragile external CSS files.
- **Lucide Icons**: A lightweight and visually consistent icon set for common UI actions.
- **TypeScript**: Crucial for managing complex nested objects like OpenAPI schemas and ensuring runtime stability.
- **Local Storage**: Used for persisting history and user preferences without a mandatory backend database for lightweight deployments.
