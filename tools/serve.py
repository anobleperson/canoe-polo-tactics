"""Local dev server that disables caching so edits show up on reload.

Usage: python3 tools/serve.py [port]   (run from the repo root)
"""
import http.server
import sys


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    http.server.ThreadingHTTPServer(("", port), NoCacheHandler).serve_forever()
