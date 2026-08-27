use hyperon::metta::runner::Metta;
use hyperon::metta::text::SExprParser;

const MAX_PROGRAM_BYTES: usize = 64 * 1024;

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum HyperonBridgeError {
    ProgramTooLarge,
    EmptyProgram,
    Runtime(String),
}

impl std::fmt::Display for HyperonBridgeError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::ProgramTooLarge => write!(f, "program_too_large"),
            Self::EmptyProgram => write!(f, "empty_program"),
            Self::Runtime(message) => write!(f, "hyperon_runtime:{message}"),
        }
    }
}

impl std::error::Error for HyperonBridgeError {}

/// Runs a bounded MeTTa program in a fresh Hyperon interpreter.
///
/// This prototype intentionally does not expose learner content, network access,
/// or mutable cross-request state. Production integration must add an allowlist
/// for approved policy programs and preserve the Rust safety gate.
pub fn run_metta(program: &str) -> Result<Vec<Vec<String>>, HyperonBridgeError> {
    if program.trim().is_empty() {
        return Err(HyperonBridgeError::EmptyProgram);
    }
    if program.len() > MAX_PROGRAM_BYTES {
        return Err(HyperonBridgeError::ProgramTooLarge);
    }

    let metta = Metta::new(None);
    let results = metta
        .run(SExprParser::new(program))
        .map_err(HyperonBridgeError::Runtime)?;
    Ok(results
        .into_iter()
        .map(|atoms| atoms.into_iter().map(|atom| atom.to_string()).collect())
        .collect())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn executes_simple_policy() {
        let result = run_metta("(= (route clear) Approved) !(route clear)").unwrap();
        assert_eq!(result, vec![vec!["Approved".to_string()]]);
    }

    #[test]
    fn rejects_empty_program() {
        assert_eq!(run_metta("  "), Err(HyperonBridgeError::EmptyProgram));
    }

    #[test]
    fn rejects_oversized_program() {
        let program = "x".repeat(MAX_PROGRAM_BYTES + 1);
        assert_eq!(
            run_metta(&program),
            Err(HyperonBridgeError::ProgramTooLarge)
        );
    }

    #[test]
    fn executes_syncsenta_policy_source() {
        let policy = include_str!("../../metta-logic/syncsenta_policy.metta");
        let program = format!("{policy} !(safeguarding-route self-harm)");
        let result = run_metta(&program).unwrap();
        assert_eq!(result, vec![vec!["(Review safeguarding)".to_string()]]);
    }
}
