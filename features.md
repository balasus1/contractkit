# Feature List: Contract Kit

Contract Kit includes many powerful features for API contract design and management.

## 1. Project Management
- **Project Configuration**: Define name, module, version, and base package.
- **Base Request Path**: Define a top-level path prefix (e.g., `/api/v1`) for all endpoints.
- **Java Class Naming**: Custom naming for generated Controllers and Services.
- **Cloning/Bumping Versions**: Quickly duplicate high-level project settings and bump patch versions.

## 2. API Endpoint Builder
- **Endpoint List Management**: Create, delete, and switch between multiple endpoints.
- **RESTful Metadata**: Set endpoint name, path, and method (GET, POST, PUT, DELETE, PATCH).
- **Request/Response Objects**: 
  - Dynamic table to add/edit fields.
  - Support for `string`, `integer`, `number`, `boolean`, `object`, and `array`.
  - Sample values for documentation and payload generation.
  - Comments/Descriptions for each field.
- **Schema Field Features**: Duplicate (copy) rows, move/reorder (planned), or remove fields.

## 3. Specialized Annotations
- **Loggable**: Built-in support for @Loggable(action = "ACTION-NAME") to simplify audit logging.
- **Security**: Pre-built support for @PreAuthorize("isAuthenticated()") or custom expressions.
- **View Filter**: Integrate @JsonView(Class.class) directly into the generated controller methods.

## 4. Code & Spec Generation
- **Controller Stub**: Generates a standard Spring Boot @RestController with all dependencies and mappings.
- **DTO Generation**: Generates typed Java POJOs for all request and response structures.
- **Angular Integration**: Generates typed Angular services with standard HTTP methods and proper observable return types.
- **OpenAPI Preview**: Real-time syntax-highlighted YAML preview of the entire contract.
- **Bundle Download**: Export everything (Java, Angular, OpenAPI) as a single ZIP file.

## 5. API Contract Builder & Importer
- **Import from URL**: Load existing OpenAPI/Swagger specifications from any public URL.
- **Proxy Support**: Bypasses CORS restrictions when fetching specs from remote servers.
- **Tag-Based Grouping**: Automatically groups imported endpoints by their OpenAPI tags (controllers).
- **Try API Client**: 
  - Test any imported or built endpoint.
  - Support for Bearer Token and API Key (Header or Query) auth.
  - Live HTTP status and response body display.
  - Tree-view for exploring JSON response objects.

## 6. GitHub & Deployment
- **Release Publisher**: Directly push generated OpenAPI YAML files to a GitHub release.
- **Asset Management**: Automatic cleanup/replacement of existing assets within the same release tag.
- **PAT Authentication**: Secure publishing via personal access tokens.

## 7. Productivity & UX
- **Searchable Sources**: Save and manage multiple OpenAPI URLs (sources) for quick access (Ctrl+K).
- **Notification Center**: Track changes and background task statuses (publishing, loading).
- **Persistent Storage**: Saves history and configuration in local storage for session-to-session continuity.
- **Responsive Workspace**: Works across desktops and tablets with collapsible sidebars.
