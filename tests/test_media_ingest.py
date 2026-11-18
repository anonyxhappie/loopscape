import importlib.util
import tempfile
import unittest
from pathlib import Path

MODULE_PATH = Path(__file__).resolve().parents[1] / "scripts" / "media_ingest.py"
SPEC = importlib.util.spec_from_file_location("media_ingest", MODULE_PATH)
media_ingest = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(media_ingest)

class MediaIngestUnitTests(unittest.TestCase):
    def test_slugify_normalizes_names(self):
        self.assertEqual(media_ingest.slugify("  Soft Orbit — 01  "), "soft-orbit-01")
    def test_slugify_falls_back_for_empty_name(self):
        self.assertEqual(media_ingest.slugify("東京"), "untitled-loop")
    def test_rational_frame_rate(self):
        self.assertAlmostEqual(media_ingest.rational("30000/1001"), 30000 / 1001)
    def test_invalid_rational(self):
        self.assertIsNone(media_ingest.rational("0/0"))
        self.assertIsNone(media_ingest.rational("N/A"))
    def test_supported_extensions(self):
        self.assertIn(".mp4", media_ingest.SUPPORTED_EXTENSIONS)
        self.assertNotIn(".gif", media_ingest.SUPPORTED_EXTENSIONS)
    def test_hash_is_stable(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "source.bin"
            path.write_bytes(b"loopscape")
            self.assertEqual(media_ingest.sha256_file(path), media_ingest.sha256_file(path))
            self.assertEqual(len(media_ingest.sha256_file(path)), 64)

if __name__ == "__main__":
    unittest.main()
