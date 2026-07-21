# Security policy

## Supported releases

Security fixes are provided on the latest published minor release.

| Version | Supported |
| --- | --- |
| 1.2.x | Yes |
| 1.1.x and earlier | No |

Consumers should upgrade to the latest 1.2.x patch after v1.2.0 is published.

## Reporting a vulnerability

Do not open a public issue for a suspected vulnerability. Use GitHub's private
**Security → Report a vulnerability** flow for
[`sdcorejs/sdcorejs-utils`](https://github.com/sdcorejs/sdcorejs-utils/security/advisories/new).

Include the affected version, runtime, entry point, minimal reproduction, expected
impact, and any known mitigations. Do not include real secrets or personal data. The
maintainers will acknowledge the report through the private advisory and coordinate
validation, remediation, and disclosure there.

## Security boundaries

This package provides defensive primitives, but the following APIs are not security
controls:

- `StringUtilities.encrypt`/`decrypt` and `obfuscate`/`deobfuscate` are reversible
  legacy obfuscation. They provide no confidentiality, integrity, or authenticity and
  must not protect secrets, tokens, authorization state, signed state, or PII.
- `hash`/`hash32` are collision-prone non-cryptographic hashes. Do not use them for
  signatures, authentication, password storage, tamper detection, or persistent
  untrusted identities. Use `sha256Canonical` only when an unkeyed SHA-256 digest fits
  the threat model; a digest is not a MAC or signature.
- Browser extension, MIME, size, URL, and other client-side validation improves user
  experience but cannot establish file safety or remote content type. Validate again on
  a trusted server and scan content where appropriate.
- Client-side filter evaluation is not an authorization boundary. Attackers control
  their client; enforce row-, field-, and action-level access on the server.
- `detectIncognito` is a deprecated, unreliable browser heuristic. It must not affect
  access, fraud, authentication, or privacy decisions. Its bounded completion behavior
  does not make the result trustworthy.
- `generateUuid` produces unpredictable UUID v4 identifiers when Web Crypto is
  available, but UUIDs are identifiers, not authentication credentials.

## Authenticated encryption

`encryptAesGcm` uses Web Crypto AES-GCM with a fresh 96-bit IV and accepts AES keys of
128, 192, or 256 bits. Applications remain responsible for key generation, derivation,
storage, rotation, access control, backup, and deletion. Never reuse raw key material
across unrelated trust domains. Use additional authenticated data to bind context when
appropriate and supply the identical bytes during decryption.

The token includes a public versioned envelope; metadata and token length are not
secret. Authentication occurs before plaintext parsing. Errors intentionally avoid
including plaintext, keys, or cryptographic details.

If Web Crypto is unavailable, cryptographic hashing and AES operations fail with
`WebCryptoUnavailableError`; secure random generation fails with
`SecureRandomUnavailableError`. These typed failures are part of the secure contract:
applications must handle or surface them, not replace them with `Math.random`, legacy
obfuscation, or another unauthenticated fallback.

## Object-key safety guarantee

Public object builders and shared path traversal reject the dangerous segments
`__proto__`, `prototype`, and `constructor` at every level. Safe traversal reads own
data properties only, skips accessors by default, rejects malformed/excessively deep
paths, and cannot walk into `Object.prototype` or `Function.prototype` through those
segments. Object output uses validated data-property definition so an input key cannot
replace the result's prototype.

These guarantees cover the library operations documented for v1.2. They do not make an
arbitrary object trustworthy, validate its business schema, or sanitize it for HTML,
SQL, shell commands, or another interpreter.

## Dependency and runtime posture

The root package and all public subpaths have no RxJS runtime or declaration dependency.
Importing the package has no browser-only side effect and does not require DOM globals
in Node.js. Browser helpers require their corresponding DOM APIs only when invoked;
Web Crypto-dependent helpers fail with the typed errors described above when the runtime
does not provide the required capability. Release CI validates ESM, CommonJS,
declarations, browser bundling, packed artifacts, and imports without optional
dependencies.
