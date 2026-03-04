# 1942 Delivery Operating Model

## GM Structure
Arcade GM manages **3 Product Managers**:

1. **PM-Alpha (Core Gameplay)**
2. **PM-Beta (Content + Level Design)**
3. **PM-Gamma (Quality + Release)**

Each PM runs the same pod shape:
- **5 Engineer lanes** (Codex Spark execution lanes)
- **2 QA resources**
- **2 Game Designers**
- **2 Test Engineers**

## Why “lanes” for engineers
Engineer capacity is provisioned as Codex Spark sessions, so each PM always has 5 concurrent implementation lanes even when specific agent IDs rotate.

## Shared Operating Artifacts
- `1942/project-tracking.csv` — master task ledger
- `ops/pm-shared-queue.csv` — PM intake / assignment queue
- `1942/docs/progress-pulse.md` — concise status pulse

## Cadence
- PM sync + rebalance: every 5 minutes (pulse)
- QA sweep: at milestone boundaries
- Release gate: QA + Test Engineering signoff from PM-Gamma
