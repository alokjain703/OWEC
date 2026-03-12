"""CE module router."""
from fastapi import APIRouter

from app.modules.ce.controllers.ce_schemas_controller import router as schemas_router
from app.modules.ce.controllers.ce_templates_controller import router as templates_router
from app.modules.ce.controllers.ce_traits_controller import router as traits_router
from app.modules.ce.controllers.ce_trait_packs_controller import router as trait_packs_router
from app.modules.ce.controllers.ce_entities_controller import router as entities_router
from app.modules.ce.controllers.ce_relationships_controller import router as relationships_router
from app.modules.ce.controllers.ce_graph_controller import router as graph_router
from app.modules.ce.controllers.ce_ai_controller import router as ai_router
from app.modules.ce.controllers.ce_trait_groups_controller import router as trait_groups_router
from app.modules.ce.controllers.ce_trait_options_controller import router as trait_options_router
from app.modules.ce.controllers.ce_admin_controller import router as ce_admin_router

router = APIRouter(prefix="/ce")
router.include_router(schemas_router)
router.include_router(templates_router)
router.include_router(traits_router)
router.include_router(trait_packs_router)
router.include_router(trait_groups_router)
router.include_router(trait_options_router)
router.include_router(entities_router)
router.include_router(relationships_router)
router.include_router(graph_router)
router.include_router(ai_router)
router.include_router(ce_admin_router)
