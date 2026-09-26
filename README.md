# Intelligent Collaboration and Resource Management System (WorkBridge)

> **Official Project Title**: Intelligent Collaboration and Resource Management System  
> **Platform Name**: WorkBridge  
> **Type**: B.Tech Final Year Capstone Project  
> **Architecture**: Post-Hire Execution, Requirement Version Locking & Governance Platform  

---

## 1. Project Overview
**WorkBridge** is an enterprise-grade post-hire collaboration platform designed to eliminate scope creep and streamline project execution between Clients and Service Providers. Unlike conventional freelance marketplaces, WorkBridge focuses entirely on the post-hire lifecycle: requirement negotiation, frozen scope versioning (v1.0), unified resource directories, and milestone verification.

---

## 2. Core Functional Modules
* **RBAC & Authentication Engine**: Role-isolated routing (`CLIENT`, `SERVICE_PROVIDER`, `ADMIN`) backed by Spring Security 6 stateless JWT tokens.
* **Requirement Version-Locking Engine**: Tamper-proof history tracking requirement drafts, reviews, and locked scope definitions to avoid dispute scenarios.
* **Centralized Collaboration Hub**: Single source of truth for assets (Figma links, API documentation, design systems) paired with persistent workspace messaging.
* **Smart Hybrid Sync**: Task-aligned GitHub commit tracking combined with a deterministic manual verification override for academic evaluations.
* **On-Demand AI Assistant**: Zero-background-load smart analysis using Google Gemini API (`gemini-1.5-flash`) for contract audits and requirement summarization.

---

## 3. Technology Stack
* **Backend**: Java 21 (LTS), Spring Boot 3.3.4 (Web, JPA, Security, Actuator)
* **Security & Tokens**: Spring Security 6, JJWT (0.12.6), BCrypt Password Encryption
* **Database**: In-Memory H2 Relational Database (`jdbc:h2:mem:workbridge_db`) with 13 relational tables
* **Frontend**: Vanilla HTML5, CSS3, Modular Modern JavaScript (ES6+) via VS Code Live Server (Port 5500)
* **AI Engine**: Google Gemini API via REST HTTP client

---

## 4. Getting Started Locally

### Prerequisites
* JDK 21 installed
* VS Code with Java Extension Pack & Live Server

### Execution Steps
1. **Start Backend**:
   * Open the project root in VS Code.
   * Navigate to `backend/src/main/java/com/workbridge/api/WorkBridgeApplication.java`.
   * Click **Run** (Application starts on port `8080`).
2. **Access Database Console**:
   * URL: `http://localhost:8080/h2-console`
   * JDBC URL: `jdbc:h2:mem:workbridge_db` | User: `sa` | Password: *(blank)*
3. **Start Frontend Client**:
   * Right-click `frontend/auth.html` and select **Open with Live Server** (Port `5500`).