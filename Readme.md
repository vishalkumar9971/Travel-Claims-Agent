# Travel Claims Agent

A small AI-powered travel reimbursement assistant built with Next.js. The app lets a user ask policy questions and review reimbursement claims using a knowledge base grounded in HCL travel policy rules, with LLM-based reasoning through the OpenRouter API.

## Project Overview

This project combines:

- a chat assistant for travel policy questions
- a claim review workflow for reimbursement submissions
- a local persistence layer for chat history and sampled claims
- a rule-grounded evaluation approach that checks categories, per-diem limits, receipts, and approval thresholds

The app is designed as a practical prototype rather than a production enterprise system.

---

## Solution Approach Used in This Project

1. Policy-grounded retrieval
   - A local knowledge base stores rules like eligible categories, lodging caps, meal caps, receipt requirements, and approval tiers.
   - The chat API retrieves relevant excerpts before responding to a user query.

2. LLM decision layer with OpenRouter
   - The assistant uses the Mistral model exposed through OpenRouter.
   - The same model is used to reason over claim data and produce structured JSON decisions for review.

3. Rule-based evaluation logic
   - Review logic is grounded in the travel policy document and uses the same policy IDs such as `POL-CAT-01`, `POL-PD-01`, `POL-RCT-02`, and `POL-APR-03`.
   - The app routes exceptions, missing receipts, high-value claims, and premium airfare to manual review when appropriate.

4. Interactive UI
   - Users can chat with the policy assistant.
   - They can review claims in a dashboard-like panel and view sample claim data stored locally.
   - History is preserved in browser storage for quick demo usage.

---

## Actual Features in the App

- Travel policy Q&A chat assistant
- Claim review endpoint returning structured JSON results
- UI for exploring conversation history
- Sample claim database and seeded claim records
- Local browser-side persistence for chats and claims
- Theme toggle and responsive layout

---

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- OpenRouter SDK
- LocalStorage persistence

---

## Project Structure

- `app/api/chat/route.ts` — chat assistant API route
- `app/api/claim-review/route.ts` — claim review API route
- `lib/knowledge-base.ts` — knowledge base and policy search logic
- `lib/models.tsx` — model definitions
- `components/` — UI components for chat, sidebar, claims, and history
- `screenshotes/` — UI screenshots used for documentation

---

## Setup

1. Install dependencies

```bash
npm install
```

2. Create a local environment file

```bash
copy .env.example .env
```

If `.env.example` is not present, create `.env` manually with:

```env
OPENROUTER_API_KEY=your_openrouter_api_key_here
```

3. Start the app

```bash
npm run dev
```

4. Open the local app in the browser at

```text
http://localhost:3000
```

---

## Required Environment Variable

```env
OPENROUTER_API_KEY=your_key_here
```

This key is used only in server-side API routes and is not exposed to the browser.

---

## Screenshots

These screenshots are from the project’s demo UI and reflect the actual implemented experience.

### Chat assistant and decision view

![Main UI](screenshotes/Screenshot%202026-08-31%20223442.png)

### Claim history and chat panel

![Chat sidebar and history](screenshotes/Screenshot%202026-08-31%20223436.png)

### Travel claim review workflow

![Claim review screen](screenshotes/Screenshot%202026-08-31%20223426.png)

### Policy and reimbursement conversation

![Policy assistant view](screenshotes/Screenshot%202026-08-31%20223412.png)

### Example claim discussion

![Claim discussion example](screenshotes/Screenshot%202026-08-31%20223359.png)

### Additional demo screen

![Demo screen](screenshotes/Screenshot%202026-08-31%20223351.png)

---

## Notes

- This project is a prototype and intentionally keeps the policy logic simple and explainable.
- The app relies on local browser storage for demo persistence, so state resets when local storage is cleared.
- For real deployment, environment configuration should be managed via platform secrets rather than a checked-in `.env` file.

---

## Example Use Cases

- Ask: “What is the daily meal reimbursement limit?”
- Ask: “Can I claim alcohol or minibar expenses?”
- Submit a claim for review and get a structured decision with reasons
- Inspect policy-based reasoning and retrieved knowledge snippets

This README now reflects the actual architecture and behavior of the project rather than the original generic assignment text.