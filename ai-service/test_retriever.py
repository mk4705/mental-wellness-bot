import unittest

from core.retriever import format_source_name


class SourceMetadataTests(unittest.TestCase):
    def test_formats_knowledge_filename_for_display(self):
        self.assertEqual(format_source_name("cbt_thought_record.txt"), "CBT Thought Record")
        self.assertEqual(
            format_source_name("data/knowledge/emotional-regulation_handbook.txt"),
            "Emotional Regulation Handbook",
        )


if __name__ == "__main__":
    unittest.main()
