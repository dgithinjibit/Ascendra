use crate::{AgentPolicy, Decision, MainAgent, MettaError, Request};

/// Provider-neutral text generation seam for the Rust agent runtime.
///
/// A production backend can implement this with an HTTP client, an on-device
/// model, or an offline cache. The policy planner runs before this trait is
/// invoked, so blocked requests never reach an inference provider.
pub trait TextBackend {
    fn generate(&mut self, prompt: &str) -> Result<String, BackendError>;
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum BackendError {
    Unavailable(String),
    InvalidResponse(String),
}

impl std::fmt::Display for BackendError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Unavailable(message) => write!(f, "backend unavailable: {message}"),
            Self::InvalidResponse(message) => write!(f, "invalid backend response: {message}"),
        }
    }
}

impl std::error::Error for BackendError {}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum RuntimeError {
    Metta(MettaError),
    Backend(BackendError),
}

impl std::fmt::Display for RuntimeError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Metta(error) => error.fmt(f),
            Self::Backend(error) => error.fmt(f),
        }
    }
}

impl std::error::Error for RuntimeError {}

impl From<MettaError> for RuntimeError {
    fn from(error: MettaError) -> Self {
        Self::Metta(error)
    }
}

impl From<BackendError> for RuntimeError {
    fn from(error: BackendError) -> Self {
        Self::Backend(error)
    }
}

/// Rust-owned orchestration boundary for Syncsenta.
///
/// The runtime performs: Rust policy planning -> MeTTa verdict enforcement ->
/// optional text generation. This makes the Python agent service replaceable
/// without changing the student-facing policy contract.
pub struct AgentRuntime<B> {
    planner: MainAgent,
    backend: B,
}

impl<B> AgentRuntime<B> {
    pub fn new(policy: AgentPolicy, backend: B) -> Self {
        Self {
            planner: MainAgent::new(policy),
            backend,
        }
    }

    pub fn plan(&self, request: &Request, metta_atom: &str) -> Result<Decision, RuntimeError> {
        Ok(self.planner.plan_with_metta_result(request, metta_atom)?)
    }

    pub fn handle(
        &mut self,
        request: &Request,
        metta_atom: &str,
        prompt: &str,
    ) -> Result<RuntimeResponse, RuntimeError>
    where
        B: TextBackend,
    {
        let decision = self.plan(request, metta_atom)?;
        if !decision.is_actionable() {
            return Ok(RuntimeResponse {
                decision,
                text: "This request requires a safety, consent, or human-review step before learning assistance can continue.".to_string(),
            });
        }

        let text = self.backend.generate(prompt)?;
        Ok(RuntimeResponse { decision, text })
    }
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct RuntimeResponse {
    pub decision: Decision,
    pub text: String,
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{AgeBand, Connectivity, ConsentState, Role, SafetySignals};

    #[derive(Default)]
    struct FakeBackend {
        calls: usize,
    }

    impl TextBackend for FakeBackend {
        fn generate(&mut self, prompt: &str) -> Result<String, BackendError> {
            self.calls += 1;
            Ok(format!("generated: {prompt}"))
        }
    }

    fn safe_request() -> Request {
        Request::new("Explain fractions")
            .with_request_id("runtime-test")
            .with_role(Role::Student)
            .with_age_band(AgeBand::Primary)
            .with_connectivity(Connectivity::Online)
            .with_consent(ConsentState::Granted)
            .with_safety(SafetySignals::default())
    }

    #[test]
    fn approved_metta_verdict_reaches_backend() {
        let mut runtime = AgentRuntime::new(AgentPolicy::default(), FakeBackend::default());
        let response = runtime
            .handle(&safe_request(), "Approved", "Explain fractions")
            .unwrap();
        assert!(response.decision.is_actionable());
        assert_eq!(response.text, "generated: Explain fractions");
    }

    #[test]
    fn review_verdict_blocks_backend() {
        let mut runtime = AgentRuntime::new(AgentPolicy::default(), FakeBackend::default());
        let response = runtime
            .handle(&safe_request(), "(Review consent)", "Explain fractions")
            .unwrap();
        assert!(!response.decision.is_actionable());
        assert!(response.text.contains("human-review"));
    }
}
