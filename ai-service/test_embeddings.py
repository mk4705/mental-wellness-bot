import unittest
from unittest.mock import MagicMock, patch

import numpy as np

from core import embeddings


class HuggingFaceEmbeddingTests(unittest.TestCase):
    def setUp(self):
        embeddings._embed_cached.cache_clear()

    def tearDown(self):
        embeddings._embed_cached.cache_clear()

    @patch("core.embeddings.requests.post")
    @patch("core.embeddings._get_hf_token", return_value="test-token")
    def test_embed_returns_normalized_384_dim_vector(self, get_token, post):
        response = MagicMock(status_code=200)
        response.json.return_value = [[2.0] * embeddings.DIMENSION]
        post.return_value = response

        vector = embeddings.embed("calm breathing exercise")

        self.assertEqual(vector.shape, (384,))
        self.assertEqual(vector.dtype, np.float32)
        self.assertAlmostEqual(float(np.linalg.norm(vector)), 1.0, places=6)
        self.assertEqual(post.call_count, 1)
        self.assertTrue(embeddings.HF_EMBEDDING_URL.endswith("/pipeline/feature-extraction"))
        self.assertEqual(post.call_args.kwargs["json"]["normalize"], True)
        self.assertEqual(post.call_args.kwargs["timeout"], embeddings.HF_TIMEOUT_SECONDS)

    @patch("core.embeddings.requests.post")
    @patch("core.embeddings._get_hf_token", return_value="test-token")
    def test_embed_cache_avoids_duplicate_remote_requests(self, get_token, post):
        response = MagicMock(status_code=200)
        response.json.return_value = [[1.0] * embeddings.DIMENSION]
        post.return_value = response

        first = embeddings.embed("same query")
        second = embeddings.embed("same query")

        self.assertEqual(post.call_count, 1)
        self.assertIsNot(first, second)

    def test_rejects_wrong_embedding_dimension(self):
        with self.assertRaisesRegex(ValueError, "384-dimensional"):
            embeddings._parse_embedding([[1.0] * 383])

    def test_rejects_zero_length_embedding(self):
        with self.assertRaisesRegex(ValueError, "zero-length"):
            embeddings._parse_embedding([[0.0] * embeddings.DIMENSION])


if __name__ == "__main__":
    unittest.main()
