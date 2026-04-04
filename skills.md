# Contract Kit Skills & Capabilities

Contract Kit is a comprehensive API Contract Management and Code Generation platform. It bridges the gap between API design and implementation by providing a visual builder for contracts and automated artifact generation.

## Core Capabilities

### 1. Visual API Contract Builder
- **Project Configuration**: Define project naming, base packages, and module structures.
- **Endpoint Design**: Create and manage RESTful endpoints with custom paths, methods (GET, POST, PUT, DELETE, PATCH), and summaries.
- **Schema Management**: Robust UI for defining request and response schemas using primitive types (string, integer, number, boolean, object, array).
- **Metadata & Annotations**: Integration of security (@PreAuthorize), logging (@Loggable), and view filtering (@JsonView) patterns directly into the contract.

### 2. Multi-Target Code Generation
- **Java (Spring Boot)**: Generates production-ready Controllers, DTOs, and Services following standard enterprise patterns.
- **Frontend (Angular)**: Automates the creation of typed API services for seamless frontend integration.
- **OpenAPI Specification**: Exports standardized YAML and JSON documents (OpenAPI 3.0.0).

### 3. API Synergy & Testing
- **OpenAPI Importer**: Import existing specs from URLs or local sources to iterate on existing APIs.
- **Live API Testing (Try API)**: Built-in client to test endpoints with support for Bearer Token and API Key authentication.
- **Dynamic Payload Preview**: Real-time visualization of JSON request bodies and response trees.

### 4. Enterprise Integration
- **GitHub Release Integration**: Directly publish generated OpenAPI contracts as assets to GitHub repository releases.
- **Version Control & History**: Snapshot-based history tracking for project iterations, allowing users to revert or clone previous versions.
- **In-App Notifications**: Real-time feedback on project changes, field additions, and publishing status.

## Technical Stack
- **Framework**: Next.js (React)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Logic**: TypeScript
- **State Management**: React Hooks (useState, useMemo, useEffect, useRef)
- **Utilities**: JSZip for bundle creation, js-yaml/OpenAPI-types for spec handling.
