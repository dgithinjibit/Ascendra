# Vercel deployment diagnosis — 2026-08-28

The active project `ascendra-u1eu` (`prj_MfFK64GZ7aPvPyCbpSKW2F4CzHLh`) is linked to `dgithinjibit/Ascendra` and has production domain `https://ascendra-u1eu.vercel.app`.

Vercel Build and Deployment settings visibly show:

- Framework Preset: Next.js.
- Root Directory: `studio`.
- Include files outside the root directory in the Build Step: Enabled.
- Skip deployments when there are no changes to the root directory or dependencies: Disabled.

The failed production deployment for commit `8912aa6` was not caused by the current Root Directory setting. Its build log showed `useSearchParams()` on `/auth/error` without a Suspense boundary. That was fixed in commit `a953adf`; the replacement deployment has no error/stderr events and was observed as queued in the deployment list, while the project metadata later reported the latest deployment as READY.

The live URL still showed the legacy line `Ask Mwalimu for guided help` because the production alias had been serving an older READY deployment (`b864e39`) before the replacement deployment advanced. The current repository source has no active product-level Mwalimu branding; remaining matches are legitimate Kiswahili curriculum text using `mwalimu`.

The Root Directory is already correctly configured as `studio`. The next check is the production override shown by Vercel, because the settings page indicates the current production deployment configuration differs from the current project settings. If the deployment remains incorrect, inspect or remove that production override and redeploy without changing the repository unnecessarily.


Additional browser evidence: the Vercel Production Overrides panel for the current production deployment shows Build Command `npm run build`, Output Directory `.next`, Install Command `npm install`, and Development Command `npm run dev`. The project-level Root Directory is visibly `studio`; Framework Preset is Next.js. This means the current UI configuration is internally consistent, but the failed deployment may have used a stale override or a different project/root context. The next verification compares the exact Git commit manifests and deployment metadata.


Live verification after deployment `dpl_E6K21c6hCq3Z5dT8fG1X1NzB7oKQ` became READY:

- `https://ascendra-u1eu.vercel.app/` now displays SyncSenta branding and the role card reads `Ask SyncSenta for guided help`; the legacy `Ask Mwalimu` line is gone.
- `https://ascendra-u1eu.vercel.app/auth/signup?role=student` loads successfully and visibly includes `School (optional for home learners)`, `Choose a school or home learning`, `I learn at home / no school`, the grade selector, Google sign-up, and wallet sign-up.
- The active production alias is attached to deployment `a953adf` with `readyState: READY`, `aliasError: null`, and framework `nextjs`.
