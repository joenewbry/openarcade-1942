# PM Pod Playbook (GM-Controlled)

## Objective
Run delivery through 3 PM pods while keeping all coding work on Codex Spark lanes.

## Pods
- PM-Alpha: Core gameplay and combat systems
- PM-Beta: Content pipeline and level/editor work
- PM-Gamma: QA, release readiness, regression control

## Shared Controls
1. Intake all work in `ops/pm-shared-queue.csv`.
2. PMs promote accepted work into `1942/project-tracking.csv`.
3. Every engineer task must include `Execution_Mode=codex-spark`.
4. QA/Test engineer signoff required before release handoff.

## Cadence
- PM pulse: every 5 minutes
- Rebalance check: every 30 minutes
- QA gate update: on each task completion

## Reporting Upstream
PM-Gamma posts concise status upstream (counts + blockers + URL) each pulse.
