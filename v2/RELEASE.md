# Darkspire II releases

Use Node.js 24 or newer. From this folder, run `npm ci`, then `npm run release`.
The command runs behavior tests, strict TypeScript and the production build before
assembling `.release/darkspire-ii-VERSION-HASH/` and the matching ZIP.

The release contains compiled game code, self-hosted fonts, reviewed runtime art,
a SHA-256 file manifest, and a local launcher. Source masters, tests, dependencies,
personal saves, QA fixtures and source maps are excluded. Entry asset paths and
literal runtime image references are checked. The ZIP uses sorted paths and fixed
timestamps; identical built bytes produce the same archive hash. Source/build
reproducibility requires the checked-in lockfile and the same Node platform.

On Windows, extract the ZIP and open `PLAY.cmd`. It uses installed Node, or Joel's
portable Node path, and opens `http://127.0.0.1:5190/`. On Mac/Linux, run
`node serve.mjs` from the extracted folder. The server listens on loopback only;
keep its window open. It refuses to take over an occupied port. A fixed address
keeps browser saves consistent between updates. Update the extracted folder while
the server is stopped and retain the same address and browser profile.

## Publication

The parent `.github/workflows/pages.yml` remains manually dispatched. It verifies
and builds both games, uses the existing V1 allowlisted artifact unchanged, and
adds the validated V2 artifact under `v2/`. The resulting V2 URL is
`https://joelgellis.github.io/darkspire/v2/`; publishing replaces neither the root
V1 entry point nor its save key. Commit only reviewed game changes and dispatch
the workflow after production browser QA. Building locally never publishes.

The V1 manifest describes its root files. V2 has its own nested
`v2/release-manifest.json` with version, build hash and every V2 artifact checksum.
Preserve both manifests when deploying. An older V2 artifact can be copied back
into the `v2/` subdirectory for an explicit rollback; export saves first, since
older code may not understand newly added content.

## Save recovery

Browser data is specific to origin and browser profile. Local preview and public
Pages saves are separate; use Help's export/import when moving between them.
Only `darkspire-2-campaign-v1` is accessed, never V1 saves.

Autosave validates every state and retains one previous valid checkpoint. A
corrupt active save is preserved and its previous checkpoint can be viewed with
autosave paused. Explicit restore, import and fresh-start operations keep the
replaced active bytes in one bounded recovery slot before changing the campaign.
Imports commit successfully before replacing live state. Any quota or security
failure leaves the prior active save intact. Help can export live state, stored
bytes, the previous checkpoint and recovery bytes separately. Recovery keeps the
most recently replaced campaign, not an unlimited archive; export valuable old
saves before another explicit replacement.

A stale tab refuses to overwrite a save changed by another tab after loading.
This comparison is best effort: Web Storage has no atomic cross-tab transaction.
Use one active game tab per origin. No cloud account or server receives saves.
