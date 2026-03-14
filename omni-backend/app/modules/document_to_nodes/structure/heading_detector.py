"""
Heading Detector
Classifies TextBlocks as headings or body-text by combining:
  1. Regex pattern matching (Part / Chapter / Section etc.)
  2. Font-size outlier detection (blocks significantly larger than the median)
  3. Bold flag heuristic
"""
from __future__ import annotations

import re
import statistics
from dataclasses import dataclass

from app.modules.document_to_nodes.models.import_tree_models import TextBlock, NodeRole


# ── Heading patterns ────────────────────────────────────────────────────────────

_PATTERNS: list[tuple[re.Pattern, NodeRole]] = [
    # Book-level  (rarely appears, but handle it)
    (re.compile(r"^\s*(BOOK|VOLUME)\s+[\dIVXivx]+", re.I), "book"),
    # Part
    (re.compile(r"^\s*(PART|SECTION|VOLUME)\s+[\dIVXivx]+", re.I), "part"),
    # Chapter
    (re.compile(r"^\s*(CHAPTER|CH\.?|CHAP\.?)\s+[\dIVXivx]+", re.I), "chapter"),
    # Numbered section  e.g. "1.", "1.2", "1.2.3"
    (re.compile(r"^\s*\d+(\.\d+)*\.?\s+\S"), "section"),
    # Roman numeral headings
    (re.compile(r"^\s*[IVXLCDM]+\.\s+\S"), "section"),
    # Epilogue / Prologue / Foreword / Appendix
    (re.compile(r"^\s*(PROLOGUE|EPILOGUE|FOREWORD|APPENDIX|INTRODUCTION|CONCLUSION|AFTERWORD)", re.I), "chapter"),
]


@dataclass
class ClassifiedBlock:
    block: TextBlock
    is_heading: bool
    role: NodeRole


def detect_headings(blocks: list[TextBlock]) -> list[ClassifiedBlock]:
    """
    Return a ClassifiedBlock for every input block, marking headings.

    Strategy (in priority order):
    1. Regex match → always a heading
    2. Font size > median + 2 standard-deviations AND short text → heading
    3. Bold AND very short text (≤ 10 words) → heading
    """
    if not blocks:
        return []

    # Compute font-size statistics
    sizes = [b.font_size for b in blocks]
    median_size = statistics.median(sizes)
    try:
        stdev_size = statistics.stdev(sizes)
    except statistics.StatisticsError:
        stdev_size = 0.0
    large_threshold = median_size + max(2.0, stdev_size * 1.5)

    results: list[ClassifiedBlock] = []

    for block in blocks:
        role: NodeRole = "unknown"
        is_heading = False

        # 0. Explicit heading level from docx parser – highest priority
        if block.heading_level is not None:
            is_heading = True
            # Try pattern first even for headings (e.g. "Chapter 1: …")
            for pattern, matched_role in _PATTERNS:
                if pattern.match(block.text):
                    role = matched_role
                    break
            else:
                role = _role_from_heading_level(block.heading_level)
            results.append(ClassifiedBlock(block=block, is_heading=True, role=role))
            continue

        # 1. Pattern match
        for pattern, matched_role in _PATTERNS:
            if pattern.match(block.text):
                is_heading = True
                role = matched_role
                break

        # 2. Font-size heuristic
        if not is_heading and block.font_size >= large_threshold:
            word_count = len(block.text.split())
            if word_count <= 15:  # long blocks probably aren't titles
                is_heading = True
                role = _infer_role_from_size(block.font_size, median_size)

        # 3. Bold + short text heuristic
        if not is_heading and block.bold:
            word_count = len(block.text.split())
            if word_count <= 10:
                is_heading = True
                role = "section"

        results.append(ClassifiedBlock(block=block, is_heading=is_heading, role=role))

    return results


# ── Helpers ─────────────────────────────────────────────────────────────────────

def _infer_role_from_size(font_size: float, median: float) -> NodeRole:
    """Guess a role based on how much larger the heading is vs body text."""
    ratio = font_size / max(median, 1)
    if ratio >= 2.0:
        return "part"
    if ratio >= 1.6:
        return "chapter"
    if ratio >= 1.2:
        return "section"
    return "scene"


def _role_from_heading_level(level: int) -> NodeRole:
    """Map a Word heading level (1-based) to an OMNI NodeRole."""
    mapping: dict[int, NodeRole] = {
        1: "chapter",
        2: "section",
        3: "scene",
    }
    return mapping.get(level, "scene")
