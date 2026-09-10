                    STOCKFLOW V2
                         │
                         ▼
             ┌─────────────────────┐
             │ MILESTONE 0         │
             │ Foundation          │
             │                     │
             │ Secrets             │
             │ PostgreSQL config   │
             │ Migration baseline  │
             │ deleteUser ACID     │
             └──────────┬──────────┘
                        ▼
             ┌─────────────────────┐
             │ MILESTONE 1         │
             │ Inventory Correctness│
             │                     │
             │ FOR UPDATE          │
             │ CHECK constraint    │
             │ Remove AsyncLock    │
             │ Atomic audit        │
             └──────────┬──────────┘
                        ▼
             ┌─────────────────────┐
             │ MILESTONE 2         │
             │ API Reliability     │
             │                     │
             │ Zod middleware      │
             │ Idempotency         │
             │ Stock adjustment    │
             └──────────┬──────────┘
                        ▼
             ┌─────────────────────┐
             │ MILESTONE 3         │
             │ Verification        │
             │                     │
             │ Integration tests   │
             │ Concurrency tests   │
             │ Rollback tests      │
             │ E2E                 │
             └──────────┬──────────┘
                        ▼
             ┌─────────────────────┐
             │ MILESTONE 4         │
             │ Production Hardening│
             │                     │
             │ Pino                │
             │ Request IDs         │
             │ Health checks       │
             │ Permissions         │
             │ Security scanning   │
             │ Runbook             │
             └─────────────────────┘