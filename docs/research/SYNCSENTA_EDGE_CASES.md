# SyncSenta Edge-Case and Design Register

SyncSenta is an education system used by learners, teachers, guardians, and administrators across different devices, languages, connectivity levels, and accessibility needs. The main reliability risk is not only an incorrect generated sentence; it is an incorrect decision about **who should answer, what evidence is sufficient, whether the request is safe to answer, and whether a local result is still current**.

The Rust core added in this branch treats those decisions as typed state. It keeps MeTTa as a declarative policy layer while keeping input validation, fan-out limits, privacy boundaries, and final actionability in Rust. This follows the Nzi design lesson that a slow reasoning layer must propose and be gated before it can produce an actionable outcome.

## Edge-case matrix

| Edge case | Failure if ignored | Required behavior | Branch status |
|---|---|---|---|
| Empty or whitespace-only message | Router guesses an intent or panics | Deny as invalid input and expose a human-review path without throwing | Implemented and unit-tested |
| Oversized message | Memory, prompt, or provider abuse | Enforce a 16 KiB request limit before routing | Implemented and unit-tested |
| Unknown role, grade, subject, or language | False precision and wrong curriculum path | Preserve `unknown`, route conservatively, and surface uncertainty | Implemented in typed request contract |
| Child with unknown or guardian-required consent | Independent AI conversation without an appropriate adult boundary | Hold for human review; never silently approve | Implemented and unit-tested |
| Consent explicitly denied | Processing continues despite a clear boundary | Deny and do not fan out to content experts | Implemented and unit-tested |
| Self-harm, abuse, exploitation, sexual content involving a minor, or dangerous activity | Ordinary tutor answers a high-risk request | Route only to safety and human review; return no ordinary content plan | Implemented as conservative signal boundary |
| Prompt injection or request to reveal system/developer content | Hidden instructions or sensitive policy leaks | Treat the message as untrusted data, hold for review, and do not fan out | Implemented and unit-tested |
| Password, private-key, phone, or home-address request | Credential or personal-data exposure | Hold at the privacy boundary and minimize the trace | Implemented as privacy signal |
| Offline connectivity | System pretends live sources or remote verification succeeded | Use deterministic offline fallback and cached/provenance-tagged content only | Implemented in routing mode |
| Metered connectivity | Excessive fan-out or payload cost | Cap expert set to three, retain shared safety/grounding | Implemented and unit-tested |
| Native MeTTa runtime unavailable | CI and low-resource deployments cannot start | Keep the Rust boundary independent from native Hyperon; accept a deterministic fallback or explicit policy error | Implemented at contract level; runtime adapter is next integration step |
| MeTTa returns empty, ambiguous, or malformed output | Unverified action becomes actionable | Accept only `Approved`, `(Review <reason>)`, or `(Rejected <reason>)`; unknown output is an error | Implemented and unit-tested |
| MeTTa says `Approved` while Rust policy denies/reviews | Declarative rule accidentally overrides hard safety boundary | Rust policy wins; downgrade to review and keep the decision non-actionable | Implemented and unit-tested |
| Expert duplication or route explosion | Unbounded latency, cost, and inconsistent synthesis | Deduplicate, use deterministic score ordering, and enforce top-k | Implemented and unit-tested |
| Expert collapse or shared capability omission | One specialist dominates and safety/grounding disappear | Keep shared safety and grounding experts in every allowed route | Implemented and unit-tested |
| Accessibility need is absent from the message | Visual/audio/motor/cognitive needs are ignored | Carry explicit accessibility metadata and add inclusion support | Implemented in typed contract |
| Local language or cultural context | Translation erases meaning or overstates fluency | Add localization, preserve CBC terms, and expose uncertainty | Implemented in routing; translation quality remains an integration concern |
| High-stakes assessment or credential decision | Incomplete evidence produces an irreversible label | Route to assessment plus grounding and require teacher review in the product layer | Partially implemented; high-stakes workflow needs integration tests |
| Stale learner progress or teacher edits during offline sync | Newer data is overwritten or mastery is computed from old state | Use versioned records, explicit conflict status, and human resolution for semantic conflicts | Design requirement; not yet an application sync engine |
| Duplicate retry after timeout | A message, score, or assignment is applied twice | Make request IDs idempotent at the persistence boundary | Rust request ID is carried; persistence integration remains pending |
| Partial expert failure | One missing specialist causes synthesis to invent a result | Record unavailable experts, synthesize only available evidence, or review when required evidence is missing | Core contract is ready; provider executor integration remains pending |
| Unsupported curriculum claim | The tutor presents generated content as an official standard | Attach provenance or mark the claim as uncertain; never invent KICD alignment | Prompt and grounding contract added; curriculum data integration remains pending |
| Sensitive telemetry in logs | Learner privacy risk and excessive retention | Keep public summaries free of raw message and direct identifiers; restrict trace fields | Implemented and unit-tested |

## Recommended execution sequence

The main agent should evaluate input validity first, then apply the Rust safety and consent policy, then render the structured MeTTa policy query. Only an explicit MeTTa `Approved` result may make an otherwise allowed request actionable. After approval, the bounded router selects shared safety and grounding plus the smallest set of specialists required by intent, accessibility, language, connectivity, and Vision 2030 goal.

In an offline or metered state, the agent should prefer a small local expert set and tell the caller when live verification is unavailable. A local response is not equivalent to a current response. On reconnect, the persistence layer should reconcile by opaque request ID and version rather than by arrival order. Semantic conflicts involving grades, safeguarding, assessment outcomes, or teacher overrides should be escalated instead of resolved with last-write-wins.

## Research basis

The official Kenya Vision 2030 site defines a high-quality-of-life objective and identifies the Social Pillar, Education & Training, ICT development, and special-needs support as relevant domains. UNICEF’s child-centred AI guidance highlights safety, privacy, fairness, transparency, accountability, and children’s best interests. UNESCO recommends a human-centred and age-appropriate approach to generative AI in education, including privacy protection and age limits for independent conversations. WCAG 2.2 provides testable accessibility guidance across devices and disabilities. NIST’s Generative AI Profile provides a risk-management reference for generative systems. Nzi contributes the two-rate, fail-closed supervisor pattern; Syncsenta Studio contributes per-session MeTTa isolation and a pure-Rust fallback seam; and the local schemer repo contributes stable CBC-oriented domain fields.

## References

[1]: https://vision2030.go.ke/ "Kenya Vision 2030"
[2]: https://vision2030.go.ke/social-pillar/ "Kenya Vision 2030 Social Pillar"
[3]: https://vision2030.go.ke/sectors/education_and_training/ "Kenya Vision 2030 Education and Training sector"
[4]: https://vision2030.go.ke/project/information-communication-and-technology-ict-development/ "Kenya Vision 2030 ICT Development"
[5]: https://www.unicef.org/innocenti/reports/policy-guidance-ai-children "UNICEF Guidance on AI and children"
[6]: https://www.unesco.org/en/articles/guidance-generative-ai-education-and-research "UNESCO Guidance for generative AI in education and research"
[7]: https://www.w3.org/TR/WCAG22/ "Web Content Accessibility Guidelines (WCAG) 2.2"
[8]: https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence "NIST AI RMF: Generative Artificial Intelligence Profile"
[9]: https://github.com/trueagi-io/hyperon-experimental "Hyperon experimental MeTTa implementation"
[10]: https://github.com/ml-rust/oxidizr/blob/main/docs/architecture/moe.md "oxidizr MoE Guide"
[11]: https://github.com/dgithinjibit/schemer "Local schemer reference repository"
