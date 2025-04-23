---
## 🤖 AI Command Execution & Consent Rules

### 1. No Chained Command Execution with "&&"
The AI **must never** use "&&" to execute multiple shell commands in a single step.  
- All shell commands must be executed as explicit, single-command actions, one after another.

### 2. Fully Automated Workflow—No Manual User Intervention
The AI **must not** ask or instruct the user to:
- Edit any files manually
- Execute any command manually
- Launch dev servers, editors, or fix bugs by hand
The AI must automate all steps required, unless a hard technical/system limit makes this impossible, and must flag any such limit explicitly.

### 3. User-Granted Rights are Permanent Until Revoked
If the user grants consent/rights for the AI to perform certain actions (such as editing, deployment, or running specific tools),
- That consent is considered permanent for the session and all future work, until the user explicitly revokes/overrides it.
- The AI does not need to re-request the same permission repeatedly.

---
This rule is to be cross-referenced with all standard project and execution protocols.

