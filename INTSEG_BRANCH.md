# Interactive segmentation branch

Branch: `feature/local-seed-inference` (2026-09-09).

Full viewer: `tumor-intseg.html` wraps `tumor-seg-demo.html`.
Minimal diagnostic: `tumor-intseg-local.html`.
Browser regression tests: `tests/*smoke.cjs` (existing Playwright + Edge).

Protected test URL: https://intseg-test.michaelzenkay.com/ . Cloudflare serves
this worktree through the local inference service, not through GitHub Pages.
Working-file changes can therefore affect the test site before they are committed.

Canonical operational/branch handoff, restart commands, limitations, and verified
results live in the companion backend worktree:
`C:/src/3dunet-intseg/interactive_server/LOCAL_INFERENCE.md`.

This feature checkpoint is being committed on its own branch; main website files
are not updated or published by a feature-branch push.
Do not put Cloudflare tokens, session cookies, checkpoints, or MRI files in Git.

## Integration into the main site

Use separate pull requests for the website and backend branches. Review and test
the saved demo with no API query parameter before merging the website PR.
GitHub Pages publishes static files; it cannot run the Python/CUDA backend.
Keep the main saved demo independent of the laptop. A deliberate follow-up website
change can link to the protected test hostname for live inference (no index link
has been added by this checkpoint). The development wrapper defaults to localhost
unless served via the tunnel's same-origin entry point; merging it alone does not
configure public live inference for GitHub Pages visitors.

Do not simply point the Pages viewer's API at the protected tunnel: cross-origin
Access cookies/CORS would need additional design and testing. The current separate,
same-origin protected test is intentional. Access still permits only the configured
user; invite policies must be changed separately before recruiters can log in.
