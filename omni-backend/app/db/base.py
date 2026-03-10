"""Import all models here so Alembic / Base.metadata.create_all can see them."""
from app.db.session import Base  # noqa: F401
from app.models.project import Project  # noqa: F401
from app.models.node import Node  # noqa: F401
from app.models.entity import Entity  # noqa: F401
from app.models.event import Event, EventEntity  # noqa: F401
from app.models.edge import Edge  # noqa: F401
from app.models.schema import NarrativeSchema  # noqa: F401
from app.modules.ce.models.ce_schema import CeSchema  # noqa: F401
from app.modules.ce.models.ce_template import CeTemplate  # noqa: F401
from app.modules.ce.models.ce_trait import CeTraitDef, CeTraitPack, CeTraitPackTrait  # noqa: F401
from app.modules.ce.models.ce_entity import CeEntity, CeEntityTrait  # noqa: F401
from app.modules.ce.models.ce_relationship import CeRelationshipType, CeRelationship  # noqa: F401
from app.modules.ce.models.ce_ai_trait import CeAiTrait  # noqa: F401
