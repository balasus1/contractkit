# 🚀 Contract Kit

> Design, build, test, and generate API contracts — all in one place.

Contract Kit AKA Contract First API kit is a powerful full-stack developer toolkit for **API contract design, code generation, and integration workflows**. It bridges the gap between backend, frontend, and API documentation by providing a unified, developer-first experience.

---

## ✨ Why Contract Kit?

Modern API development is fragmented:
- Backend defines contracts
- Frontend guesses types
- Docs go out of sync
- Max. 4 days or approx. 0.5 sprint are wasted in communicating back and forth with frontend and backend team to keep the REST API Request payloads and Response from Server to keep them aligned and in agreement how the business needs them.

👉 Contract Kit solves this by making the **API contract the single source of truth**.

---
## High Level Architecture

<img width="1176" height="935" alt="image" src="https://github.com/user-attachments/assets/14633566-20c5-4551-b1a3-063223425201" />

---

💡  Contract Kit follows a **contract-first, code-generation-driven architecture** that ensures consistency across backend, frontend, and API documentation layers.

---

## 🧩 Core Features

### 📦 1. Project Management
- Define **project metadata** (name, module, version, base package)
- Global **base path** (e.g. `/api/v1`)
- Custom naming for generated **Controllers & Services**
- Dynamic Form Builder
- Clone projects & **bump versions instantly**
- History logs
- Rollback of generated OpenAPI config files

---

### 🔧 2. API Endpoint Builder
Design APIs visually with full control:

- Create & manage multiple endpoints
- Define:
  - HTTP methods (GET, POST, PUT, DELETE, PATCH)
  - Paths and naming
- Build request/response schemas:
  - Supported types: `string`, `integer`, `number`, `boolean`, `object`, `array`
  - Add sample values & descriptions
  - Duplicate fields for faster modeling

---

### 🛡️ 3. Built-in Annotations Support
Generate production-ready APIs with:

- `@Loggable(action = "...")` for audit logging  
- `@PreAuthorize(...)` for security  
- `@JsonView(...)` for response filtering  

---

### ⚙️ 4. Code & Spec Generation

Generate everything from your contract:

- 🟢 **Spring Boot Controllers**
- 📦 **DTO Classes (Java POJOs)**
- 🔵 **Angular Services (typed)**
- 📄 **OpenAPI (Swagger) YAML**
- 📦 Export as **ZIP bundle**
- Download customized OpenAPI as JSON or YAML

---

### 🔄 5. API Contract Import & Testing

- Import OpenAPI specs via URL  
- Auto-group endpoints by tags  
- Built-in API client:
  - Bearer Token / API Key auth
  - Live response viewer
  - JSON tree explorer  

---

### 🧪 6. GitHub Integration

- Publish OpenAPI specs directly to [GitHub](chatgpt://generic-entity?number=0) releases  
- Manage assets automatically  
- Secure via Personal Access Token (PAT)  

---

### ⚡ 7. Developer Experience (DX)

- 🔍 Global search (Ctrl + K)  
- 🔔 Notification center  
- 💾 Persistent local storage  
- 📱 Responsive UI (desktop + tablet)

---

## 🏗️ Use Cases

- Backend-first API design  
- Frontend-backend contract alignment  
- Rapid prototyping for any microservices design  
- OpenAPI-driven development  
- Developer tooling / platform engineering  

---

## 🧠 Tech Philosophy

Contract Kit is built around:

- **Contract-first development**
- **Type safety across stack**
- **Automation over repetition**
- **Developer productivity**

---

## 🚀 Getting Started

```bash
# Clone the repo
git clone https://github.com/your-username/contract-kit.git

# Install dependencies
npm install

# Start the app
npm run dev

📸 Preview (Coming Soon)

UI screenshots / demo GIFs will go here

🛣️ Roadmap

* Multi-language backend generation (Node, Go)
* GraphQL support
* Team collaboration features
* Cloud sync
* Role based form viewer and approval on form fields by PROJECT_MANAGER, FUNCTIONAL_TEAM, FRONT_END


🤝 Contributing

Contributions are welcome!
If you’re interested in improving developer tooling, feel free to open issues or PRs.z

📄 License

MIT License
