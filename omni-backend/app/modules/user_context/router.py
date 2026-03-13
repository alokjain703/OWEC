"""User Context module – aggregated router."""
from fastapi import APIRouter

from app.modules.user_context.controllers.settings_controller import (
    router as settings_router,
)
from app.modules.user_context.controllers.preferences_controller import (
    router as preferences_router,
)
from app.modules.user_context.controllers.activity_controller import (
    router as activity_router,
)
from app.modules.user_context.controllers.bookmarks_controller import (
    router as bookmarks_router,
)

router = APIRouter(prefix="/user-context")

router.include_router(settings_router)
router.include_router(preferences_router)
router.include_router(activity_router)
router.include_router(bookmarks_router)
