# NestJS Fastify Bootstrap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the first backend slice under `backend/` using NestJS + Fastify, exposing a typed health endpoint and a read-only rules catalog backed only by the local compacted 5etools dataset.

**Architecture:** Keep the backend fully isolated from the current frontend runtime. Start with a small NestJS application whose modules are `app`, `health`, and `rules`; the `rules` module reads JSON only from `data/5etools/5e-2024/` through a typed repository service. The frontend continues untouched for now.

**Tech Stack:** NestJS, Fastify adapter, TypeScript, Node test runner, local 5etools compact JSON data.

---

### Task 1: Bootstrap backend workspace

**Files:**
- Create: `backend/package.json`
- Create: `backend/tsconfig.json`
- Create: `backend/tsconfig.build.json`
- Create: `backend/src/main.ts`
- Create: `backend/src/app.module.ts`

- [ ] Write failing test coverage for backend startup shape
- [ ] Install NestJS + Fastify dependencies in `backend/`
- [ ] Add the minimal bootstrap files to compile and start a Nest app

### Task 2: Add health module

**Files:**
- Create: `backend/src/modules/health/health.controller.ts`
- Create: `backend/src/modules/health/health.module.ts`
- Test: `backend/test/health.e2e-spec.ts`

- [ ] Write a failing end-to-end test for `GET /health`
- [ ] Implement the controller/module to return stable typed health payload
- [ ] Verify the endpoint through the Nest testing app

### Task 3: Add read-only rules module

**Files:**
- Create: `backend/src/modules/rules/rules.module.ts`
- Create: `backend/src/modules/rules/rules.controller.ts`
- Create: `backend/src/modules/rules/rules.service.ts`
- Create: `backend/src/modules/rules/rules.repository.ts`
- Create: `backend/src/modules/rules/contracts/rules-catalog-entry.ts`
- Test: `backend/test/rules.e2e-spec.ts`

- [ ] Write failing tests for `GET /rules/backgrounds`, `GET /rules/classes`, and `GET /rules/spells`
- [ ] Implement a typed repository that reads only from `data/5etools/5e-2024/*.json`
- [ ] Return minimal catalog entries with stable fields needed by later API slices

### Task 4: Wire scripts and docs

**Files:**
- Modify: `README.md`
- Modify: `melhoria.txt`
- Modify: root `package.json` if convenient for backend helper scripts

- [ ] Add backend run/build/test commands to docs
- [ ] Mark the first backend roadmap slice as in progress / partially complete
- [ ] Verify the backend independently from the current frontend
