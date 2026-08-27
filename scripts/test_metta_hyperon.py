from pathlib import Path
from hyperon import MeTTa

POLICY = Path(__file__).resolve().parents[1] / "metta-logic" / "syncsenta_policy.metta"


def main() -> None:
    metta = MeTTa()
    source = POLICY.read_text(encoding="utf-8")
    metta.run(source)
    checks = {
        "clear_safeguarding": metta.run("!(safeguarding-route clear)"),
        "self_harm_review": metta.run("!(safeguarding-route self-harm)"),
        "offline_assessment_review": metta.run("!(assessment-finalization-route offline-pending-sync)"),
        "valid_attendance": metta.run("!(attendance-action-route valid granted)"),
        "replayed_attendance_review": metta.run("!(attendance-token-route replayed)"),
    }
    for name, result in checks.items():
        print(f"{name}: {result}")


if __name__ == "__main__":
    main()
