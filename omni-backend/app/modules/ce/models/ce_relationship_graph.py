"""Helper models for CE graph responses."""

from dataclasses import dataclass


@dataclass
class CeGraphNode:
    id: str
    label: str
    type: str


@dataclass
class CeGraphEdge:
    source: str
    target: str
    type: str
