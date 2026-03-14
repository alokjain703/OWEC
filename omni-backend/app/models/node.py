"""ORM – Node (Recursive Tree)"""
import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, Integer, Numeric, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class Node(Base):
    __tablename__ = "nodes"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False
    )
    parent_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("nodes.id", ondelete="CASCADE"), nullable=True
    )

    depth: Mapped[int] = mapped_column(Integer, nullable=False)
    order_index: Mapped[int] = mapped_column(Integer, nullable=False)
    order_key: Mapped[float | None] = mapped_column(Numeric, nullable=True)
    node_role: Mapped[str] = mapped_column(String, nullable=False)  # universe|collection|major_unit|atomic_unit

    title: Mapped[str | None] = mapped_column(Text, nullable=True)
    content: Mapped[str | None] = mapped_column(Text, nullable=True)
    content_format: Mapped[str] = mapped_column(Text, nullable=False, default="html", server_default="html")

    path: Mapped[str | None] = mapped_column(Text, nullable=True)
    has_children: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")

    metadata_: Mapped[dict] = mapped_column("metadata", JSONB, nullable=False, default=dict)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Self-referential tree
    project: Mapped["Project"] = relationship(back_populates="nodes")  # type: ignore[name-defined]
    parent: Mapped["Node | None"] = relationship("Node", remote_side="Node.id", back_populates="children")
    children: Mapped[list["Node"]] = relationship("Node", back_populates="parent", cascade="all, delete-orphan")

    # Edges
    outgoing_edges: Mapped[list["Edge"]] = relationship("Edge", foreign_keys="Edge.from_node", back_populates="source_node")  # type: ignore[name-defined]
    incoming_edges: Mapped[list["Edge"]] = relationship("Edge", foreign_keys="Edge.to_node", back_populates="target_node")  # type: ignore[name-defined]

    __table_args__ = (
        Index("idx_nodes_project_id", "project_id"),
        Index("idx_nodes_parent_id", "parent_id"),
        Index("idx_nodes_depth", "depth"),
        Index("idx_nodes_node_role", "node_role"),
        Index("idx_nodes_path", "path"),
        Index("idx_nodes_order_key", "project_id", "parent_id", "order_key"),
        Index("idx_nodes_metadata", "metadata", postgresql_using="gin"),
    )
