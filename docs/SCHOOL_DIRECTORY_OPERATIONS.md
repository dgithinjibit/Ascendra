# SyncSenta school-directory operations

## Verified state

The canonical Supabase project is `tumikgwhrbvirpjswlzh`. The `public.schools` and `public.school_classes` tables now exist with row-level security enabled. Anonymous and authenticated users can read active records only. Service-role operations are restricted to trusted server-side administration.

The current counts are:

| Table | Active records |
|---|---:|
| `public.schools` | 0 |
| `public.school_classes` | 0 |

The empty result is intentional. SyncSenta must not create fabricated schools, classes, or student placements in production.

## How to unblock student signup

An authorized operator must publish genuine directory data before students can complete school selection. The source should be an approved school register or a Head-of-School submission that has been verified by the project operator. A data import must include, at minimum, the school name, county, stable school code where available, class name, grade, academic year, and active status.

The import must run with the service role from a trusted server-side process or an approved administrative workflow. The service role must never be sent to the browser. The public signup client should remain read-only.

A safe sequence is:

1. Obtain the approved school and class list from the Ministry/school operator or an equivalent authoritative source.
2. Validate required fields, duplicate school codes, duplicate `(school_id, name, academic_year)` combinations, permitted status values, and grade values.
3. Insert or update the records through a server-side administrative process.
4. Query the active directory using the anonymous read path.
5. Verify that a school returns only its active classes for the selected grade.
6. Run student signup without submitting an account and confirm that no unrelated school or class is visible.

## What is not an acceptable unblock

Do not seed placeholder schools, use mock classes, bypass RLS with a browser key, expose a service-role key, or allow a student to select an unverified free-text school as if it were an approved directory record.

## Current product behavior

If the schema is unavailable, signup reports that the directory service is temporarily unavailable. If the schema is present but empty, signup reports that no approved schools are available and asks the user to contact a school administrator. This distinction prevents an empty production directory from being mistaken for a client failure.

## Manual onboarding route

Schools can now submit a registration request at `/schools/register`. The form collects only an authorized contact name, work email, school name, county, optional school code, school type, and class or grade names. It must not collect learner names, learner identifiers, passwords, biometric information, or assessment data.

The form writes to `public.school_onboarding_requests` with `status = 'pending'`. Public and authenticated clients may create pending requests, but they cannot read, approve, reject, or activate requests. Students never query this table. A trusted service-role workflow must review the contact and school information before creating or updating a row in `public.schools` and related `public.school_classes` records with `status = 'active'`.

The smallest remaining production-safe addition is the reviewer interface or controlled import that authenticates the reviewer, verifies school authority, records the review decision, and supports deactivation without deleting historical relationships. Until a request is approved, it does not unblock student school selection.
