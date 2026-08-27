"""Rule Learning Job - Automated rule discovery from teacher feedback.

This job runs periodically (e.g., daily) to:
1. Analyze teacher feedback patterns
2. Propose new rules
3. Update rule confidence scores
4. Export rule snapshots

This is the "self-learning" automation that makes syncsenta
smarter without manual intervention.
"""

import asyncio
from datetime import datetime
from pathlib import Path
import os

from ..core.logging import AgentLogger
from ..reasoning.rule_sync_service import get_rule_sync_service


class RuleLearningJob:
    """Automated rule learning from teacher feedback."""
    
    def __init__(self, supabase_client=None):
        self.logger = AgentLogger("rule_learning_job")
        self.rule_sync = get_rule_sync_service(supabase_client)
    
    async def run(self):
        """Run the complete rule learning pipeline."""
        self.logger.info("Starting rule learning job")
        
        try:
            # Step 1: Sync existing rules from database
            self.logger.info("Step 1: Syncing rules from database...")
            await self.rule_sync.sync_from_database()
            
            # Step 2: Analyze feedback and propose new rules
            self.logger.info("Step 2: Analyzing teacher feedback...")
            proposed_rules = await self.rule_sync.propose_rules_from_feedback(
                min_feedback_count=10,  # Need at least 10 feedback entries
                min_helpful_rate=0.7    # 70% helpful rate to propose rule
            )
            
            if proposed_rules:
                self.logger.info(f"Proposed {len(proposed_rules)} new rules")
                
                # Save proposed rules to database for teacher validation
                for rule in proposed_rules:
                    await self.rule_sync.save_proposed_rule_to_database(rule)
                    self.logger.info(
                        f"Proposed rule: {rule.rule_name} "
                        f"(confidence: {rule.confidence:.0%})"
                    )
            else:
                self.logger.info("No new rules proposed (insufficient data or low success rate)")
            
            # Step 3: Export rules snapshot for versioning
            self.logger.info("Step 3: Exporting rules snapshot...")
            snapshots_dir = Path("ai-agents/data/rule_snapshots")
            snapshots_dir.mkdir(parents=True, exist_ok=True)
            
            snapshot_path = await self.rule_sync.export_rules_snapshot(snapshots_dir)
            self.logger.info(f"Exported snapshot: {snapshot_path}")
            
            # Step 4: Generate summary report
            self.logger.info("Step 4: Generating summary report...")
            report = self._generate_report(proposed_rules)
            
            # Save report
            report_path = snapshots_dir / f"report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
            report_path.write_text(report)
            self.logger.info(f"Saved report: {report_path}")
            
            self.logger.info("Rule learning job completed successfully")
            
            return {
                "success": True,
                "proposed_rules_count": len(proposed_rules),
                "snapshot_path": str(snapshot_path),
                "report_path": str(report_path)
            }
            
        except Exception as e:
            self.logger.error(f"Rule learning job failed: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def _generate_report(self, proposed_rules) -> str:
        """Generate a human-readable report of the learning job."""
        report = []
        report.append("=" * 60)
        report.append("SYNCSENTA - RULE LEARNING REPORT")
        report.append(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        report.append("=" * 60)
        report.append("")
        
        if not proposed_rules:
            report.append("No new rules proposed in this run.")
            report.append("")
            report.append("Possible reasons:")
            report.append("- Insufficient teacher feedback (need at least 10 entries)")
            report.append("- Low success rate (need at least 70% helpful rate)")
            report.append("- No clear patterns detected")
        else:
            report.append(f"Proposed {len(proposed_rules)} new rules:")
            report.append("")
            
            for i, rule in enumerate(proposed_rules, 1):
                report.append(f"{i}. {rule.rule_name}")
                report.append(f"   Rule ID: {rule.rule_id}")
                report.append(f"   Confidence: {rule.confidence:.0%}")
                report.append(f"   Action: {rule.action}")
                report.append(f"   Explanation: {rule.metadata.get('explanation', 'N/A')}")
                report.append(f"   Sample Size: {rule.metadata.get('sample_size', 'N/A')}")
                report.append(f"   Success Rate: {rule.metadata.get('success_rate', 0):.0%}")
                report.append("")
        
        report.append("=" * 60)
        report.append("NEXT STEPS")
        report.append("=" * 60)
        report.append("")
        report.append("1. Review proposed rules in teacher dashboard")
        report.append("2. Teachers vote on proposals (upvote/downvote)")
        report.append("3. Approved rules enter A/B testing")
        report.append("4. Validated rules become active")
        report.append("")
        report.append("This is how syncsenta learns from Kenyan teachers!")
        report.append("")
        
        return "\n".join(report)


async def run_rule_learning_job():
    """Entry point for running the job (can be called from scheduler)."""
    from supabase import create_client
    
    # Initialize Supabase client
    supabase = create_client(
        os.getenv("SUPABASE_URL"),
        os.getenv("SUPABASE_SERVICE_KEY")
    )
    
    # Run job
    job = RuleLearningJob(supabase)
    result = await job.run()
    
    return result


if __name__ == "__main__":
    # Run job directly
    print("Running rule learning job...")
    result = asyncio.run(run_rule_learning_job())
    
    if result["success"]:
        print(f"✅ Job completed successfully")
        print(f"   Proposed rules: {result['proposed_rules_count']}")
        print(f"   Snapshot: {result['snapshot_path']}")
        print(f"   Report: {result['report_path']}")
    else:
        print(f"❌ Job failed: {result['error']}")
