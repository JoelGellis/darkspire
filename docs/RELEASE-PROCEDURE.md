# Incremental demo release

Repository discovery on 2026-09-09: `JoelGellis/darkspire` is public, default branch `master`, homepage unset, GitHub Pages disabled (`has_pages: false`; Pages API returns 404). No existing demo URL was verified. Intended Pages URL after deployment: `https://joelgellis.github.io/darkspire/`.

`node scripts/build-release.js` parses every shipped script, executes every non-fixture/non-harness Node suite in `tests/`, and assembles only the index-referenced runtime JS/CSS and `assets/exported/`. It writes a content-addressed `.release/<hash>/` directory with a manifest. The generated index injects an immutable `DS.VERSION` used by the archive and visibly labels the game an incremental demo with Round 1 still in progress. It excludes tests, logs, private run data, source art, references, planning docs and the `.git` directory. Repeated builds of identical runtime sources produce the same identity and contents.

Before publishing: inspect the current working tree; preserve the pre-existing August gameplay wave; run the builder; visually verify the integrated runtime including mandatory player identity, embark/armory, map, combat, reward, merchant, save/resume and export. A green unit suite alone does not prove these browser flows. Do not include untested expedition modules merely because they exist on disk.

Release route after integration approval:

1. Make a coherent source checkpoint on `master` including the actual runtime, regression tests and release workflow. Do not include `private-run-data/` or `.release/` (both ignored). Push without force.
2. Enable GitHub Pages with GitHub Actions as its build type for the existing public repository: `gh api --method POST repos/JoelGellis/darkspire/pages -f build_type=workflow` (use PATCH if the site already exists).
3. Trigger `gh workflow run pages.yml --ref master`. The workflow builds and verifies source, uploads only the allowlisted artifact and deploys it to the `github-pages` environment.
4. Inspect the actual Actions run to success, read the resulting Pages URL, and verify its visible content hash, player gate and manifest. Check that requests for `tests/`, `private-run-data/`, `assets/source/` and repository metadata are not served by the artifact.
5. Record the source commit, content build ID, workflow/deployment run, final verified URL and remaining scope in the state and shared memory logs.

The workflow is manual (`workflow_dispatch`); a source push alone does not publish unfinished work. Local scripted batches remain local and machine-dependent. Static GitHub Pages does not automatically ingest player archives or run background bot jobs.
