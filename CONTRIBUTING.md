# Contributing

## Workflow

We don't push to `main`. Every change goes through a feature branch + a pull request that's merged after preview-testing it.

```
git checkout -b feat/<short-description>
# or fix/<short-description>, chore/<short-description>

# ... make your changes ...

git add -A
git commit -m "concise message"

git push -u origin HEAD
```

The push triggers two things:

1. **Husky pre-push hook** runs locally — TypeScript + ESLint. If anything fails, the push is rejected. Fix and retry.
2. **GitHub Actions CI** runs the same checks on the PR. The merge button is locked until CI is green.
3. **Vercel** auto-creates a **Preview deployment** on a unique URL like `afrizonemart-feat-xyz-imammagnus40-8846s-projects.vercel.app`. Click into the PR on GitHub — the URL is in the comments.

## Reviewing your own change

Before merging, **always**:

- Open the Vercel preview URL and click through the affected pages
- Sign into `/admin/login` on the preview if your change touches admin
- Check both desktop and mobile widths (browser devtools)
- If your change touches text/images, hard-refresh to bypass cache

When satisfied, merge the PR via GitHub. Vercel auto-deploys the merged commit to production within ~2 minutes.

## API repo workflow

Same pattern, but Railway doesn't give you preview deployments on the free plan. Mitigations:

- Test locally with `npm run dev` against the dev database (`shuttle.proxy.rlwy.net:45001` per `.env`).
- The CI typecheck on the API repo is your real safety net — broken code can't merge.
- For risky changes (schema, migrations, auth), run `npx prisma db push` against dev first, sanity-check, then push.

## Branch naming

| Prefix | When to use |
|---|---|
| `feat/` | A new feature or capability |
| `fix/` | A bug fix |
| `chore/` | Tooling, config, dependency bumps |
| `refactor/` | Internal cleanup, no behaviour change |

## Skipping the hook

If you absolutely must push without the local checks (e.g. work-in-progress branch you want a teammate to look at), use:

```
git push --no-verify
```

GitHub Actions still runs on the PR — `--no-verify` only skips the local hook, not the CI gate. The merge button still requires green CI.

## Why this exists

We've shipped breakages straight to production twice in the last few weeks because main pushes go live instantly with nothing in between. The pre-push hook + PR + preview URL flow catches:

- TypeScript errors (everywhere)
- ESLint errors (e.g. unescaped quotes that block Vercel builds)
- Visual regressions (you'll see them on the preview URL before customers do)
- Whether the change actually does what you think it does

Cost: about 30 seconds of local check time per push, plus the discipline of opening a PR. Cheap insurance.
