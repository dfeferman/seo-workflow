# .cursor – Übersicht aller Artefakte

Auflistung der Skills, Agenten, Commands und Rules im Ordner `.cursor` mit kurzer Beschreibung.

---

## 1. Rules (Regeln)

| Datei | Beschreibung |
|-------|--------------|
| **common-agents.md** | Agent-Orchestrierung: parallele Ausführung, Multi-Perspektiven-Analyse |
| **common-coding-style.md** | Kern-Coding-Style: Immutability, Dateiorganisation, Fehlerbehandlung, Input-Validierung |
| **common-git-workflow.md** | Git-Commit-Format, PR-Workflow, Feature-Implementierung |
| **common-hooks.md** | Hook-System und TodoWrite-Best-Practices |
| **common-patterns.md** | Gemeinsame Design-Patterns: Skeleton-Projekte, Repository-Pattern, API-Response-Format |
| **common-performance.md** | Performance: Modellauswahl, Context-Window, Extended Thinking |
| **common-security.md** | Pflicht-Security-Checks, Secret-Management, Security-Response |
| **common-testing.md** | Testing: mind. 80 % Coverage, TDD-Workflow, Testtypen |
| **context-dev.md** | Entwicklungs-Kontext: aktiver Coding-Modus, Implementierung zuerst |
| **context-research.md** | Recherche-Kontext: Verstehen vor Handeln |
| **context-review.md** | Code-Review-Kontext: PR-Review mit Schweregraden |
$$| **golang-coding-style.md** | Go Coding-Style: gofmt, kleine Interfaces, Error-Wrapping |
$$| **golang-hooks.md** | Go Hooks: gofmt/goimports, go vet, staticcheck |
$$| **golang-patterns.md** | Go-Patterns: Functional Options, kleine Interfaces, Dependency Injection |
$$| **golang-security.md** | Go Security: Env-Secrets, gosec, Context-Timeouts |
$$| **golang-testing.md** | Go Testing: Table-Driven Tests, Race Detection, Coverage |
| **hooks-guidance.md** | Anleitung für hook-ähnliche Funktionalität in Cursor |
$$| **python-coding-style.md** | Python: PEP 8, Type Annotations, black/isort/ruff |
$$| **python-hooks.md** | Python Hooks: black/ruff, mypy/pyright, print()-Warnungen |
$$| **python-patterns.md** | Python-Patterns: Protocol, Dataclass-DTOs, Context Manager, Generators |
$$| **python-security.md** | Python Security: dotenv, bandit |
$$| **python-testing.md** | Python Testing: pytest, Coverage, Marker |
| **typescript-coding-style.md** | TS/JS Coding-Style: Immutability, Zod, async Error Handling |
| **typescript-hooks.md** | TS/JS Hooks: Prettier, tsc, console.log-Warnungen |
| **typescript-patterns.md** | TS/JS-Patterns: API-Response-Interface, React Hooks, Repository-Pattern |
| **typescript-security.md** | TS/JS Security: Env-Secrets, security-reviewer Agent |
| **typescript-testing.md** | TS/JS Testing: Playwright E2E, e2e-runner Agent |

---

## 2. Commands (Slash-Befehle)

| Command | Beschreibung |
|---------|---------------|
| **build-fix** | TypeScript-/Build-Fehler schrittweise beheben (Build ausführen, Fehler gruppieren, Kontext anzeigen) |
| **checkpoint** | Checkpoints erstellen, verifizieren oder auflisten |
| **code-review** | Umfassendes Security- und Qualitäts-Review uncommitteter Änderungen (CRITICAL/HIGH blockieren Commit) |
| **e2e** | E2E-Tests mit Playwright erzeugen und ausführen (e2e-runner Agent) |
| **eval** | Eval-driven Development: Evals definieren, prüfen, Report, Liste |
| **evolve** | Instincts in Skills, Commands oder Agents bündeln |
$$| **go-build** | Go-Build-Fehler, go vet und Linter beheben (go-build-resolver Agent) |
$$| **go-review** | Go-Code-Review: idiomatisch, Concurrency, Fehlerbehandlung, Security |
$$| **go-test** | TDD für Go: Table-Driven Tests zuerst, 80 %+ Coverage |
| **instinct-export** | Instincts exportieren (z. B. für Team oder andere Projekte) |
| **instinct-import** | Instincts importieren (Team, Skill Creator, andere Quellen) |
| **instinct-status** | Gelernte Instincts mit Konfidenz anzeigen |
| **learn** | Wiederverwendbare Muster aus Sessions extrahieren |
$$| **multi-backend** | Kollaborative Entwicklung, Backend-Fokus |
$$| **multi-execute** | Kollaborative Ausführung (Plan umsetzen, Tasks ausführen) |
$$| **multi-frontend** | Kollaborative Entwicklung, Frontend-Fokus |
$$| **multi-plan** | Kollaborative Planung (Multi-Model) |
$$| **multi-workflow** | Multi-Model-Workflow (Planung + Ausführung) |
| **orchestrate** | Orchestrierung von Abläufen |
| **plan** | Anforderungen klären, Risiken, Implementierungsplan; wartet auf Bestätigung vor Code |
| **pm2** | PM2 initialisieren (Process Manager) |
$$| **python-review** | Python-Code-Review: PEP 8, Type Hints, Security (python-reviewer Agent) |
| **refactor-clean** | Toten Code finden und entfernen (knip, depcheck, ts-prune), mit Test-Check |
| **sessions** | Sessions auflisten, Alias anlegen/laden/entfernen |
$$| **setup-pm** | Package Manager konfigurieren (npm/pnpm/yarn/bun) |
| **skill-create** | Aus lokaler Git-Historie Coding-Patterns extrahieren und SKILL.md erzeugen |
| **tdd** | TDD-Workflow: Tests zuerst, dann Implementierung, 80 %+ Coverage |
| **test-coverage** | Coverage analysieren, fehlende Tests ergänzen, 80 %+ anstreben |
| **update-codemaps** | Codebase scannen, Architektur-Dokumentation (Codemaps) aktualisieren |
| **update-docs** | Doku aus package.json, .env.example etc. synchronisieren |
| **verify** | Umfassende Verifikation: Build, Type-Check, Lint, Tests, Security |

---

## 3. Agents (Agenten)

| Agent | Beschreibung |
|-------|---------------|
| **architect** | Architektur: Systemdesign, Skalierbarkeit, technische Entscheidungen. Bei neuen Features oder großem Refactoring. |
| **build-error-resolver** | Build- und TypeScript-Fehler beheben, minimaler Diff, Build schnell grün. |
| **code-reviewer** | Code-Review für Qualität, Security, Wartbarkeit. Nach jeder Code-Änderung nutzen. |
| **database-reviewer** | PostgreSQL/Supabase: Queries, Schema, Migrationen, Performance. |
| **doc-updater** | Doku und Codemaps: /update-codemaps, /update-docs, READMEs. |
| **e2e-runner** | E2E-Tests mit Playwright (bzw. Vercel Agent Browser), Test-Journeys, Artefakte. |
$$| **go-build-resolver** | Go-Build-, vet- und Linter-Fehler mit minimalen Änderungen beheben. |
$$| **go-reviewer** | Go-Code-Review: idiomatisch, Concurrency, Fehlerbehandlung. Für Go-Projekte. |
| **planner** | Planung für komplexe Features und Refactorings. Bei Implementierungs- oder Architekturwünschen. |
$$| **python-reviewer** | Python-Code-Review: PEP 8, Type Hints, Security. Für Python-Projekte. |
| **refactor-cleaner** | Toten Code und Duplikate entfernen (knip, depcheck, ts-prune). |
| **security-reviewer** | Security: User-Input, Auth, APIs, sensible Daten; OWASP Top 10, Secrets, Injection. |
| **tdd-guide** | TDD: Tests zuerst, 80 %+ Coverage. Bei neuen Features, Bugs, Refactoring. |

---

## 4. Skills (Fähigkeiten)

| Skill | Beschreibung |
|-------|---------------|
| **backend-patterns** | Backend-Architektur (Node/Express/Next.js API), API-Design, DB-Optimierung |
| **clickhouse-io** | ClickHouse: Queries, Analytics, Data Engineering für analytische Workloads |
| **coding-standards** | Allgemeine Coding-Standards für TypeScript, JavaScript, React, Node.js |
| **configure-ecc** | Interaktiver ECC-Installer: Skills/Rules auswählen, installieren, Pfade prüfen |
| **continuous-learning** | Wiederverwendbare Muster aus Sessions extrahieren und als Skills speichern |
| **continuous-learning-v2** | Instinct-basiertes Lernen: Hooks, atomare Instincts, Evolution zu Skills/Commands/Agents |
| **cpp-coding-standards** | C++ Core Guidelines: modern, sicher, idiomatisch |
| **cpp-testing** | C++-Tests: GoogleTest/CTest, Coverage, Sanitizer |
$$| **django-patterns** | Django-Architektur, DRF, ORM, Caching, Signals, Middleware |
$$| **django-security** | Django Security: Auth, CSRF, SQL-Injection/XSS-Vermeidung, Deployment |
$$| **django-tdd** | Django-Testing: pytest-django, TDD, factory_boy, DRF-API-Tests |
$$| **django-verification** | Django-Verification: Migrations, Lint, Tests mit Coverage, Security, Deployment-Check |
$$| **eval-harness** | Formales Eval-Framework für Sessions (Eval-Driven Development) |
| **frontend-patterns** | Frontend: React, Next.js, State, Performance, UI-Best-Practices |
$$| **golang-patterns** | Idiomatisches Go: Best Practices, Konventionen |
$$| **golang-testing** | Go-Testing: Table-Driven, Subtests, Benchmarks, Fuzzing, Coverage |
$$| **java-coding-standards** | Java/Spring Boot: Naming, Immutability, Optional, Streams, Exceptions, Layout |
$$| **jpa-patterns** | JPA/Hibernate: Entities, Beziehungen, Queries, Transaktionen, Pagination |
| **iterative-retrieval** | Kontext schrittweise verfeinern (Subagent-Kontext-Problem) |
| **nutrient-document-processing** | Dokumente mit Nutrient DWS API: PDF, DOCX, OCR, Redact, Sign (PDF/DOCX/XLSX/PPTX/HTML/Bilder) |
| **postgres-patterns** | PostgreSQL: Queries, Schema, Indizes, Security (Supabase) |
| **project-guidelines-example** | Beispiel-Vorlage für projektspezifische Skills |
$$| **python-patterns** | Python: PEP 8, Type Hints, Best Practices |
$$| **python-testing** | Python-Testing: pytest, TDD, Fixtures, Mocking, Coverage |
| **security-review** | Security-Checkliste und -Patterns bei Auth, Input, Secrets, APIs, Zahlungen |
| **security-scan** | Scan der Cursor-/Claude-Konfiguration (.claude/) auf Schwachstellen und Misconfig |
| **springboot-patterns** | Spring Boot: REST, Services, Data Access, Caching, Async, Logging |
| **springboot-security** | Spring Security: Authn/Authz, Validation, CSRF, Secrets, Headers, Rate Limit |
| **springboot-tdd** | Spring Boot TDD: JUnit 5, Mockito, MockMvc, Testcontainers, JaCoCo |
| **springboot-verification** | Spring Boot Verification: Build, Static Analysis, Tests, Security, Diff vor Release/PR |
| **strategic-compact** | Kontext manuell in logischen Phasen komprimieren (nicht beliebig auto-compact) |
| **tdd-workflow** | TDD bei Features/Bugs/Refactoring: 80 %+ Coverage, Unit/Integration/E2E |
| **verification-loop** | Umfassendes Verifikationssystem für Sessions (Build, Lint, Tests, Review) |

---

*Stand: Erzeugt aus der Struktur unter `.cursor/`. Bei neuen oder geänderten Artefakten diese Übersicht anpassen.*
