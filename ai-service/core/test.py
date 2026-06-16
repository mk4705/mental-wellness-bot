import unittest
from unittest.mock import MagicMock, patch

from llm import _build_response_prompt, _validate_memory_facts, generate_response


class BuildResponsePromptTests(unittest.TestCase):
    def test_combines_all_five_inputs_in_order(self):
        prompt = _build_response_prompt(
            user_message="What should I do tonight?",
            session_history=[
                {"role": "user", "content": "Work has been stressful."},
                {"role": "assistant", "content": "What usually helps?"},
            ],
            long_term_context="- [preference] User prefers practical advice",
            rag_context="[grounding.txt]\nTry paced breathing.",
            emotion={"label": "fear", "score": 0.87},
        )

        headings = [
            "## 1. CURRENT USER MESSAGE",
            "## 2. RECENT CONVERSATION HISTORY",
            "## 3. RETRIEVED USER MEMORIES",
            "## 4. RETRIEVED KNOWLEDGE CHUNKS",
            "## 5. DETECTED EMOTION",
        ]
        positions = [prompt.index(heading) for heading in headings]

        self.assertEqual(positions, sorted(positions))
        self.assertIn("What should I do tonight?", prompt)
        self.assertIn("USER: Work has been stressful.", prompt)
        self.assertIn("User prefers practical advice", prompt)
        self.assertIn("Try paced breathing.", prompt)
        self.assertIn("label: fear", prompt)
        self.assertIn("confidence: 0.87", prompt)

    def test_removes_current_message_duplicate_from_history(self):
        prompt = _build_response_prompt(
            user_message="I feel overwhelmed",
            session_history=[
                {"role": "assistant", "content": "Tell me more."},
                {"role": "user", "content": "I feel overwhelmed"},
            ],
            long_term_context="",
            rag_context="",
            emotion={"label": "neutral", "score": 0.5},
        )

        self.assertEqual(prompt.count("I feel overwhelmed"), 1)
        self.assertIn("ASSISTANT: Tell me more.", prompt)
        self.assertIn("(no retrieved memories)", prompt)
        self.assertIn("(no retrieved knowledge)", prompt)

    @patch("llm._get_client")
    def test_groq_receives_one_structured_runtime_prompt(self, get_client):
        client = MagicMock()
        client.chat.completions.create.return_value.choices = [
            MagicMock(message=MagicMock(content="A grounded response"))
        ]
        get_client.return_value = client

        reply = generate_response(
            user_message="Help me settle down",
            session_history=[],
            long_term_context="- User likes breathing exercises",
            rag_context="Slow breathing can reduce arousal.",
            emotion={"label": "fear", "score": 0.8},
        )

        sent_messages = client.chat.completions.create.call_args.kwargs["messages"]
        self.assertEqual(reply, "A grounded response")
        self.assertEqual([message["role"] for message in sent_messages], ["system", "user"])
        self.assertIn("## 1. CURRENT USER MESSAGE", sent_messages[1]["content"])
        self.assertIn("## 5. DETECTED EMOTION", sent_messages[1]["content"])
        self.assertIn("fuller coverage", sent_messages[1]["content"])
        self.assertEqual(
            client.chat.completions.create.call_args.kwargs["max_tokens"],
            1200,
        )


class ValidateMemoryFactsTests(unittest.TestCase):
    def test_accepts_user_stated_fact_with_exact_evidence(self):
        facts = [{
            "memory_type": "preference",
            "content": "User prefers short practical advice",
            "confidence": 0.95,
            "evidence": ["I prefer short practical advice"],
        }]

        self.assertEqual(
            _validate_memory_facts(facts, ["I prefer short practical advice"]),
            [{
                "memory_type": "preference",
                "content": "User prefers short practical advice",
                "confidence": 0.95,
            }],
        )

    def test_rejects_claim_without_exact_user_evidence(self):
        facts = [{
            "memory_type": "fact",
            "content": "User has insomnia",
            "confidence": 0.9,
            "evidence": ["I had trouble sleeping"],
        }]

        self.assertEqual(_validate_memory_facts(facts, ["I had trouble sleeping"]), [])

    def test_allows_diagnosis_only_when_user_explicitly_states_it(self):
        facts = [{
            "memory_type": "fact",
            "content": "User reports a prior ADHD diagnosis",
            "confidence": 0.95,
            "evidence": ["I was diagnosed with ADHD last year"],
        }]

        self.assertEqual(
            len(_validate_memory_facts(facts, ["I was diagnosed with ADHD last year"])),
            1,
        )

    def test_requires_two_distinct_sources_for_patterns(self):
        facts = [{
            "memory_type": "emotional_pattern",
            "content": "User often feels worried before deadlines",
            "confidence": 0.9,
            "evidence": ["I felt worried before my deadline"],
        }]

        self.assertEqual(
            _validate_memory_facts(
                facts,
                [
                    "I felt worried before my deadline",
                    "Deadlines made me worried again this week",
                ],
            ),
            [],
        )

        facts[0]["evidence"].append("Deadlines made me worried again this week")
        self.assertEqual(len(_validate_memory_facts(
            facts,
            [
                "I felt worried before my deadline",
                "Deadlines made me worried again this week",
            ],
        )), 1)

    def test_rejects_unknown_or_overlong_memory(self):
        self.assertEqual(_validate_memory_facts([{
            "memory_type": "diagnosis",
            "content": "User has an anxiety disorder",
            "confidence": 1,
            "evidence": ["I feel anxious"],
        }], ["I feel anxious"]), [])

        self.assertEqual(_validate_memory_facts([{
            "memory_type": "fact",
            "content": "x" * 101,
            "confidence": 1,
            "evidence": ["I said this"],
        }], ["I said this"]), [])


if __name__ == "__main__":
    unittest.main()
