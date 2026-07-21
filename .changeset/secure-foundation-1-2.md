---
"@sdcorejs/utils": minor
---

Ship the v1.2.0 production-foundation refactor in one release: add safe object/path
handling and typed errors, authenticated AES-GCM APIs, deterministic canonical
serialization and SHA-256, strict date/filter/number/URL contracts, terminating
page-0-first pagination with a strictly zero-based contract, secure UUID v4 generation,
hardened browser workflows, and a dependency-free structural `MaybeAsync` contract.
Preserve legacy import paths and
obfuscation payloads through documented deprecated wrappers while rejecting previously
accepted unsafe or malformed inputs. One-based services adapt `pageNumber + 1` only in
their transport callback; no paging-base compatibility options are public. Strengthen
ESM/CommonJS declarations, packed consumer validation, coverage, multi-timezone tests,
CI, security guidance, and the v1.2 migration path.
