This document has higher priority than default AI behavior.

# AI Development Rules (Lightweight)

These rules define the default engineering workflow for this project.
They prioritize clarity, correctness, and maintainability while preserving development efficiency.

---

# 1. General Principles

- Prefer clarity over cleverness
- Prefer simple solutions over complex designs
- Do not assume unspecified requirements
- Ask for clarification when requirements are unclear
- Prioritize maintainable design

---

# 2. ASCII Encoding Requirement (Strict)

All generated code content MUST use ASCII characters.

This includes but is not limited to:

- Source code
- Code comments
- Logs
- Test code
- String literals
- Identifiers

Documentation may use non ASCII languages, but any code related content must remain ASCII only.

---

# 3. Requirements Clarification

Before implementation, briefly describe:

- The problem being solved
- Expected behavior
- Inputs and outputs
- Key edge cases

Keep this concise.

---

# 4. Scenario Thinking

When applicable, describe:

- Normal flow
- Edge cases
- Failure scenarios

Avoid unnecessary detail.

---

# 5. TDD Preference (Lightweight)

When practical, prefer writing tests before implementation.

Tests should cover:

- Core behavior
- Edge cases
- Failure scenarios

Avoid overly complex test structures.

---

# 5.1 End-to-End (E2E) Definition

**E2E tests require both frontend and backend.**

- E2E = full user flow through the UI (browser) to the backend API and database
- API-only tests (e.g. httptest against handlers) are integration tests, not E2E
- When implementing a feature with E2E coverage: implement frontend page + backend API + browser E2E tests (e.g. Playwright)
- E2E test location: `e2e/browser/`

---

# 6. Implementation Rules

Implementation should:

- Be minimal
- Avoid unnecessary abstraction
- Maintain clear structure
- Handle errors explicitly
- Avoid hidden logic

---

# 7. Architecture Awareness

Before coding, briefly consider:

- Where logic should reside
- Responsibility boundaries
- Dependencies
- Failure handling strategy

Keep analysis short.

---

# 8. Error Handling

- Do not ignore errors
- Return clear error messages
- Avoid silent failures
- Prefer predictable behavior

---

# 9. Code Quality

Code should be:

- Readable
- Consistent
- Easy to understand
- Easy to test

Avoid premature optimization.

---

# 10. Definition of Done

A task is complete when:

- Behavior is clear
- Edge cases are considered
- Code is understandable
- Errors are handled
- Core logic has tests

---

# 11. Clarification Protocol

If requirements are unclear or conflicting:

Questions MUST be asked before implementation.

Do not guess requirements.

---

# 12. Prohibited Behaviors

The following are not allowed:

- Jumping directly to complex solutions
- Overengineering
- Ignoring edge cases
- Writing placeholder logic without explanation
- Introducing unrelated changes
- Using non ASCII characters in code

---

# 13. Output Order (When Implementation Is Involved)

1. Brief clarification
2. Scenario summary
3. Implementation
4. Tests (if applicable)
5. Key notes

Keep responses concise.
