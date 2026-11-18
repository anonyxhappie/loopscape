import json, tempfile, unittest
from pathlib import Path
from scripts.build_catalogue import build_catalogue

class BuildCatalogueUnitTests(unittest.TestCase):
    def test_build_catalogue_with_synthetic_manifest(self):
        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            processed_dir = tmp_path / "processed" / "assets"
            public_dir = tmp_path / "public"

            asset_dir = processed_dir / "sample-loop" / "v123"
            asset_dir.mkdir(parents=True)

            # Create dummy media files
            (asset_dir / "poster.jpg").write_bytes(b"\xff\xd8\xff\xe0" + b"\x00" * 30)
            (asset_dir / "loop.webm").write_bytes(b"\x1a\x45\xdf\xa3" + b"\x00" * 50)
            (asset_dir / "loop.mp4").write_bytes(b"\x00\x00\x00\x20ftypisom" + b"\x00" * 50)
            (asset_dir / "loop.gif").write_bytes(b"GIF89a" + b"\x00" * 20)

            manifest = {
                "schema_version": 1,
                "asset_id": "sample-loop-v123",
                "slug": "sample-loop",
                "version": "v123",
                "status": "processed_pending_review",
                "source": {
                    "source_file": "sample.mp4",
                    "duration_seconds": 4.5,
                    "width": 1280,
                    "height": 720,
                },
                "variants": {
                    "poster": {"path": "poster.jpg", "bytes": 34},
                    "webm": {"path": "loop.webm", "bytes": 54, "width": 1280, "height": 720, "duration_seconds": 4.5},
                    "mp4": {"path": "loop.mp4", "bytes": 58, "width": 1280, "height": 720, "duration_seconds": 4.5},
                },
                "review": {
                    "approved_for_publication": False,
                },
            }
            (asset_dir / "asset.json").write_text(json.dumps(manifest), encoding="utf-8")

            # Without publish_all, should skip unapproved
            report1 = build_catalogue(processed_dir, public_dir, publish_all=False)
            self.assertEqual(report1["published_items"], 0)
            self.assertEqual(report1["skipped_items"], 1)

            # With publish_all, should publish and stage media
            report2 = build_catalogue(processed_dir, public_dir, publish_all=True)
            self.assertEqual(report2["published_items"], 1)
            self.assertEqual(report2["skipped_items"], 0)

            # Verify catalogue.json
            cat_file = public_dir / "data" / "catalogue.json"
            self.assertTrue(cat_file.is_file())
            cat_data = json.loads(cat_file.read_text(encoding="utf-8"))
            self.assertEqual(len(cat_data["items"]), 1)
            item = cat_data["items"][0]
            self.assertEqual(item["id"], "sample-loop-v123")
            self.assertEqual(item["slug"], "sample-loop")
            self.assertEqual(item["aspect_ratio"], round(1280 / 720, 3))
            self.assertEqual(item["duration_seconds"], 4.5)
            self.assertEqual(item["poster"], "/media/posters/sample-loop-v123.jpg")
            self.assertEqual(item["mp4"], "/media/mp4/sample-loop-v123.mp4")
            self.assertEqual(item["gif"], "/media/gifs/sample-loop-v123.gif")

            # Verify files were copied to public/media
            self.assertTrue((public_dir / "media" / "posters" / "sample-loop-v123.jpg").is_file())
            self.assertTrue((public_dir / "media" / "mp4" / "sample-loop-v123.mp4").is_file())
            self.assertTrue((public_dir / "media" / "gifs" / "sample-loop-v123.gif").is_file())

if __name__ == "__main__":
    unittest.main()
