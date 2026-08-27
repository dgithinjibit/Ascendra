"""Few-shot example loader for culturally-aware prompting.

Loads relevant examples from Kenya-LLM-Bench-v2 dataset based on:
- Student's grade level
- Student's region (Nairobi, Mombasa, rural)
- Current topic/competency
- Question similarity
"""

import json
import random
from pathlib import Path
from typing import List, Dict, Any, Optional
from ..core.logging import get_logger

logger = get_logger("few_shot_examples")


class FewShotExampleLoader:
    """Loads relevant few-shot examples from the training dataset."""
    
    def __init__(self, dataset_path: str = "data/training/kenya-llm-bench-v2-complete.jsonl"):
        """Initialize the loader with the dataset path."""
        self.dataset_path = Path(dataset_path)
        self.examples: List[Dict[str, Any]] = []
        self._load_dataset()
    
    def _load_dataset(self):
        """Load the JSONL dataset into memory."""
        if not self.dataset_path.exists():
            logger.warning(f"Dataset not found at {self.dataset_path}")
            return
        
        try:
            with open(self.dataset_path, 'r', encoding='utf-8') as f:
                for line in f:
                    if line.strip():
                        self.examples.append(json.loads(line))
            
            logger.info(f"Loaded {len(self.examples)} examples from dataset")
        except Exception as e:
            logger.error(f"Failed to load dataset: {e}")
    
    def get_examples(
        self,
        grade: Optional[str] = None,
        region: Optional[str] = None,
        competency: Optional[str] = None,
        num_examples: int = 3,
        prefer_region: bool = True
    ) -> List[Dict[str, Any]]:
        """Get relevant few-shot examples based on filters.
        
        Args:
            grade: Student's grade (e.g., "Grade 4")
            region: Student's region (Nairobi, Mombasa, rural, universal)
            competency: Current competency (e.g., "MATH.G4.FRACTIONS")
            num_examples: Number of examples to return
            prefer_region: Prefer examples from student's region
        
        Returns:
            List of example dictionaries with messages and metadata
        """
        if not self.examples:
            return []
        
        # Filter by grade
        filtered = self.examples
        if grade:
            filtered = [ex for ex in filtered if ex["metadata"].get("grade") == grade]
        
        # Filter by competency (if specified)
        if competency:
            filtered = [ex for ex in filtered if ex["metadata"].get("competency") == competency]
        
        # If we have enough examples, filter by region
        if region and prefer_region and len(filtered) >= num_examples:
            region_examples = [ex for ex in filtered if ex["metadata"].get("region") == region]
            if len(region_examples) >= num_examples:
                filtered = region_examples
            else:
                # Mix region-specific and universal examples
                universal = [ex for ex in filtered if ex["metadata"].get("region") == "universal"]
                filtered = region_examples + universal
        
        # If still not enough, fall back to all examples
        if len(filtered) < num_examples:
            filtered = self.examples
        
        # Randomly sample to avoid always showing the same examples
        if len(filtered) > num_examples:
            filtered = random.sample(filtered, num_examples)
        
        return filtered[:num_examples]
    
    def format_for_prompt(self, examples: List[Dict[str, Any]]) -> str:
        """Format examples for inclusion in a prompt.
        
        Args:
            examples: List of example dictionaries
        
        Returns:
            Formatted string ready for prompt inclusion
        """
        if not examples:
            return ""
        
        formatted_parts = ["Here are examples of good responses:\n"]
        
        for i, example in enumerate(examples, 1):
            messages = example.get("messages", [])
            metadata = example.get("metadata", {})
            
            # Find user and assistant messages
            user_msg = next((m for m in messages if m["role"] == "user"), None)
            assistant_msg = next((m for m in messages if m["role"] == "assistant"), None)
            
            if user_msg and assistant_msg:
                formatted_parts.append(f"\nExample {i}:")
                formatted_parts.append(f"Student: {user_msg['content']}")
                formatted_parts.append(f"syncsenta: {assistant_msg['content']}")
                
                # Add context info
                context_info = []
                if metadata.get("region"):
                    context_info.append(f"Region: {metadata['region']}")
                if metadata.get("cultural_context"):
                    context_info.append(f"Context: {metadata['cultural_context']}")
                
                if context_info:
                    formatted_parts.append(f"({', '.join(context_info)})")
        
        formatted_parts.append("\nNow, respond to the student's question in a similar culturally-aware way:\n")
        
        return "\n".join(formatted_parts)
    
    def get_system_prompt_with_examples(
        self,
        grade: Optional[str] = None,
        region: Optional[str] = None,
        competency: Optional[str] = None,
        num_examples: int = 3
    ) -> str:
        """Get a complete system prompt with few-shot examples.
        
        Args:
            grade: Student's grade
            region: Student's region
            competency: Current competency
            num_examples: Number of examples to include
        
        Returns:
            Complete system prompt with examples
        """
        base_prompt = (
            "You are syncsenta, a culturally-aware Kenyan AI tutor for CBC curriculum. "
            "Use local examples like matatu, shamba, M-Pesa, ugali, and shillings. "
            "Adapt to student's region (Nairobi, Mombasa, rural areas).\n\n"
        )
        
        examples = self.get_examples(
            grade=grade,
            region=region,
            competency=competency,
            num_examples=num_examples
        )
        
        if examples:
            examples_text = self.format_for_prompt(examples)
            return base_prompt + examples_text
        
        return base_prompt


# Global instance
_loader: Optional[FewShotExampleLoader] = None


def get_few_shot_loader() -> FewShotExampleLoader:
    """Get or create the global few-shot example loader."""
    global _loader
    if _loader is None:
        _loader = FewShotExampleLoader()
    return _loader
