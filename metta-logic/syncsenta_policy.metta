; Syncsenta policy contract
; The Rust main agent renders one structured query and accepts only the atoms
; Approved, (Review <reason>), or (Rejected <reason>).
; Keep policy facts/rules here so they can be audited and changed without
; changing routing code. Raw learner messages are deliberately not passed in.

; Kenya Vision 2030-aligned product goals.
(vision2030-goal inclusive-learning)
(vision2030-goal digital-skills)
(vision2030-goal skills-and-employment)
(vision2030-goal quality-of-life)

; Capability and delivery constraints.
(delivery-mode online)
(delivery-mode metered)
(delivery-mode offline)
(accessibility-mode default)
(accessibility-mode required)

; The shared expert is always grounded in policy and curriculum evidence.
(= (shared-experts) (list safety grounding))

; Child-centred protection: a child request without known consent is held.
(= (child-consent-ok? primary granted) True)
(= (child-consent-ok? secondary granted) True)
(= (child-consent-ok? early-years granted) True)
(= (child-consent-ok? adult $consent) True)
(= (child-consent-ok? unknown $consent) True)

(= (child-consent-ok? $age unknown) False)
(= (child-consent-ok? $age guardian-required) False)
(= (child-consent-ok? $age denied) False)

; Safety and privacy signals fail closed before content experts run.
(= (safety-ok? clear) True)
(= (safety-ok? flagged) False)

; Structured boundary called by the Rust main agent.
(= (syncsenta-policy $role $age $intent $goal $connectivity $consent $safety $accessibility)
   (if (not (safety-ok? $safety))
       (Review safety)
       (if (not (child-consent-ok? $age $consent))
           (Review consent)
           (if (and (= $connectivity offline) (= $intent assessment))
               (Review offline-assessment)
               (Approved)))))

; Explicit expert intent mapping for a future MeTTa-native dispatcher.
(= (intent-expert socratic-tutor) socratic-tutor)
(= (intent-expert curriculum) curriculum)
(= (intent-expert lesson-plan) lesson-architect)
(= (intent-expert assessment) assessment)
(= (intent-expert localization) localization)
(= (intent-expert inclusion) inclusion)
(= (intent-expert mastery) mastery)
(= (intent-expert career-pathways) career-pathways)
(= (intent-expert real-world-problem) real-world-problem-solver)

; Vision 2030 goals can add a specialist without replacing safety/grounding.
(= (goal-expert inclusive-learning) inclusion)
(= (goal-expert digital-skills) real-world-problem-solver)
(= (goal-expert skills-and-employment) career-pathways)
(= (goal-expert quality-of-life) socratic-tutor)
