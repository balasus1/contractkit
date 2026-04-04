# Project Requirements: Contract Kit

Contract Kit is designed to solve the challenges of API design-first development and automated contract-to-code synchronization.

## Functional Requirements (FR)

### 1. API Contract Builder
- **FR 1.1**: The system MUST allow users to configure project-level metadata (Project Name, Module Name, API Version, Base Package, Base Request Path, Controller Name, Service Name).
- **FR 1.2**: The system MUST support creating, editing, and deleting RESTful endpoints.
- **FR 1.3**: The system MUST allow defining request components (path parameters, query parameters, request body schemas).
- **FR 1.4**: The system MUST allow defining response components (status codes, response body schemas).
- **FR 1.5**: The system MUST support Spring-style annotations for endpoints (PreAuthorize, Loggable, JsonView).
- **FR 1.6**: The system MUST provide a live preview of the generated OpenAPI YAML specification.

### 2. Code Generation
- **FR 2.1**: The system MUST generate Java (Spring Boot) Controller code following standard @RestController patterns.
- **FR 2.2**: The system MUST generate DTOs for all request and response schemas.
- **FR 2.3**: The system MUST generate Angular service code for frontend integration.
- **FR 2.4**: The system MUST support downloading the entire codebase as a generated ZIP bundle.

### 3. API Import & Testing
- **FR 3.1**: The system MUST support importing existing OpenAPI (Swagger) specifications via URL.
- **FR 3.2**: The system MUST support a "Try API" feature to send test requests to configured endpoints.
- **FR 3.3**: The system MUST support Bearer Token and API Key authentication for API testing.

### 4. Integration & Persistence
- **FR 4.1**: The system MUST allow publishing generated contracts to GitHub releases using a Personal Access Token (PAT).
- **FR 4.2**: The system MUST maintain a history of published versions (locally or in a backend).
- **FR 4.3**: The system MUST allow cloning an existing project or version.

---

## Non-Functional Requirements (NFR)

### 1. Performance & Responsiveness
- **NFR 1.1**: UI components MUST be responsive and adapt gracefully to different screen sizes.
- **NFR 1.2**: Changes in the builder SHOULD reflect in the code preview within < 200ms.
- **NFR 1.3**: Large OpenAPI specifications (100+ endpoints) SHOULD be handled without significant UI lag.

### 2. Usability & UX
- **NFR 2.1**: The interface MUST use modern, premium aesthetics (consistent spacing, harmonious color palettes, clear typography).
- **NFR 2.2**: Error messages MUST be descriptive and helpful (e.g., when a GitHub PAT is missing).
- **NFR 2.3**: Interactive elements SHOULD have hover/focus states and micro-animations for feedback.

### 3. Security
- **NFR 3.1**: Sensitive data like GitHub PATs MUST NOT be stored in plain text long-term unless necessary (local storage with user awareness).
- **NFR 3.2**: API Testing SHOULD use a proxy if necessary to avoid CORS issues for cross-origin Swagger URLs.

### 4. Maintainability
- **NFR 4.1**: The codebase MUST be written in TypeScript for type safety.
- **NFR 4.2**: Components MUST be modular and reusable (e.g., EndpointCard, SchemaTable).
- **NFR 4.3**: Styling MUST use Tailwind CSS for consistency and rapid iteration.
