# Local test server for Zoomie Zoe: serves src/ on http://127.0.0.1:8742
# with caching turned off, so a normal reload always picks up code changes.
# Run from anywhere:  python3 store/tools/dev-server.py [port]   (default 8742)
import functools
import http.server
import os
import sys

SRC = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'src')


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()


handler = functools.partial(NoCacheHandler, directory=os.path.normpath(SRC))
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8742
http.server.ThreadingHTTPServer(('127.0.0.1', PORT), handler).serve_forever()
