#!/usr/bin/env python3
"""
Replaces dark glass/liquid styles with clean white SaaS styles across SCOPS pages.
Run from project root: python3 scripts/refactor-scops-white.py
"""

import re
import sys
from pathlib import Path

FILES = [
    "client/src/pages/SCOPSPipeline.tsx",
    "client/src/pages/SCOPSProperties.tsx",
    "client/src/pages/SCOPSBlog.tsx",
    "client/src/pages/SCOPSUtmBuilder.tsx",
    "client/src/pages/SCOPSSettings.tsx",
    "client/src/pages/SCOPSUsers.tsx",
    "client/src/pages/SCOPSScheduling.tsx",
    "client/src/pages/LeadDetail.tsx",
]

# Ordered list of (pattern, replacement) tuples
REPLACEMENTS = [
    # ── Dark page backgrounds ────────────────────────────────────────────────
    (r'background:\s*"radial-gradient\([^"]*#0f172a[^"]*\)"', 'background: "#f8f9fb"'),
    (r'background:\s*"radial-gradient\([^"]*#1f2937[^"]*\)"', 'background: "#f8f9fb"'),
    (r'background:\s*"linear-gradient\(135deg,\s*rgba\(30,41,59[^"]*\)"', 'background: "#f8f9fb"'),
    (r'background:\s*"linear-gradient\(135deg,\s*rgba\(15,23,42[^"]*\)"', 'background: "#f8f9fb"'),
    (r'background:\s*"#0f172a"', 'background: "#f8f9fb"'),
    (r'background:\s*"#1f2937"', 'background: "#f8f9fb"'),
    (r'background:\s*"#111827"', 'background: "#f8f9fb"'),

    # ── Glass/frosted backgrounds ────────────────────────────────────────────
    # Heavy glass (very transparent white)
    (r'background:\s*"rgba\(255,\s*255,\s*255,\s*0\.0[0-9]\)"', 'background: "#f8f9fb"'),
    (r'background:\s*"rgba\(255,\s*255,\s*255,\s*0\.1[0-9]\)"', 'background: "#ffffff"'),
    (r'background:\s*"rgba\(255,\s*255,\s*255,\s*0\.2[0-9]\)"', 'background: "#ffffff"'),
    (r'background:\s*"rgba\(255,\s*255,\s*255,\s*0\.3[0-9]\)"', 'background: "#ffffff"'),
    (r'background:\s*"rgba\(255,\s*255,\s*255,\s*0\.4[0-9]\)"', 'background: "#ffffff"'),
    (r'background:\s*"rgba\(255,\s*255,\s*255,\s*0\.5[0-9]\)"', 'background: "#ffffff"'),
    (r'background:\s*"rgba\(255,\s*255,\s*255,\s*0\.6[0-9]\)"', 'background: "#ffffff"'),
    (r'background:\s*"rgba\(255,\s*255,\s*255,\s*0\.7[0-9]\)"', 'background: "#ffffff"'),
    (r'background:\s*"rgba\(255,\s*255,\s*255,\s*0\.8[0-9]\)"', 'background: "#ffffff"'),
    (r'background:\s*"rgba\(255,\s*255,\s*255,\s*0\.9[0-9]\)"', 'background: "#ffffff"'),
    (r'background:\s*"rgba\(255,\s*255,\s*255,\s*0\.95\)"', 'background: "#ffffff"'),

    # Dark overlay backgrounds
    (r'background:\s*"rgba\(0,\s*0,\s*0,\s*0\.[0-9]+\)"', 'background: "rgba(0,0,0,0.4)"'),

    # ── Backdrop blur ────────────────────────────────────────────────────────
    (r'backdropFilter:\s*"blur\([^"]*\)",?\s*', ''),
    (r'WebkitBackdropFilter:\s*"blur\([^"]*\)",?\s*', ''),

    # ── Glass borders → clean borders ────────────────────────────────────────
    (r'border:\s*"1px solid rgba\(255,\s*255,\s*255,\s*0\.[0-9]+\)"', 'border: "1px solid #e2e6ed"'),
    (r'borderBottom:\s*"1px solid rgba\(255,\s*255,\s*255,\s*0\.[0-9]+\)"', 'borderBottom: "1px solid #e2e6ed"'),
    (r'borderTop:\s*"1px solid rgba\(255,\s*255,\s*255,\s*0\.[0-9]+\)"', 'borderTop: "1px solid #e2e6ed"'),

    # ── White text → dark text ────────────────────────────────────────────────
    (r'color:\s*"rgba\(255,\s*255,\s*255,\s*0\.9[0-9]\)"', 'color: "#111827"'),
    (r'color:\s*"rgba\(255,\s*255,\s*255,\s*0\.8[0-9]\)"', 'color: "#1f2937"'),
    (r'color:\s*"rgba\(255,\s*255,\s*255,\s*0\.7[0-9]\)"', 'color: "#374151"'),
    (r'color:\s*"rgba\(255,\s*255,\s*255,\s*0\.6[0-9]\)"', 'color: "#4b5563"'),
    (r'color:\s*"rgba\(255,\s*255,\s*255,\s*0\.5[0-9]\)"', 'color: "#6b7280"'),
    (r'color:\s*"rgba\(255,\s*255,\s*255,\s*0\.4[0-9]\)"', 'color: "#9ca3af"'),
    (r'color:\s*"rgba\(255,\s*255,\s*255,\s*0\.3[0-9]\)"', 'color: "#9ca3af"'),
    (r'color:\s*"rgba\(255,\s*255,\s*255,\s*0\.2[0-9]\)"', 'color: "#d1d5db"'),
    (r'color:\s*"rgba\(255,\s*255,\s*255,\s*0\.1[0-9]\)"', 'color: "#d1d5db"'),
    (r'color:\s*"white"', 'color: "#ffffff"'),

    # ── Input dark backgrounds → white ────────────────────────────────────────
    (r'background:\s*"rgba\(255,\s*255,\s*255,\s*0\.0[0-9]\)",\s*border:\s*"1px solid rgba\(255,\s*255,\s*255,\s*0\.[0-9]+\)",\s*borderRadius:\s*[0-9]+,\s*color:\s*"#fff"',
     'background: "#ffffff", border: "1px solid #e2e6ed", borderRadius: 8, color: "#111827"'),

    # ── Dark modal backgrounds ────────────────────────────────────────────────
    (r'background:\s*"rgba\(0,\s*0,\s*0,\s*0\.5[0-9]\)"', 'background: "rgba(0,0,0,0.4)"'),

    # ── scops-bg class ────────────────────────────────────────────────────────
    # Already handled via CSS, but ensure min-h-screen bg-gray-50 is present
]

def process_file(filepath: str) -> int:
    path = Path(filepath)
    if not path.exists():
        print(f"  SKIP (not found): {filepath}")
        return 0

    content = path.read_text(encoding="utf-8")
    original = content
    count = 0

    for pattern, replacement in REPLACEMENTS:
        new_content, n = re.subn(pattern, replacement, content)
        if n > 0:
            count += n
            content = new_content

    if content != original:
        path.write_text(content, encoding="utf-8")
        print(f"  UPDATED ({count} replacements): {filepath}")
    else:
        print(f"  NO CHANGE: {filepath}")

    return count

total = 0
for f in FILES:
    total += process_file(f)

print(f"\nTotal replacements: {total}")
