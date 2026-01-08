from .warehouses import router as warehouses_router
from .photos import router as photos_router
from .objects import router as objects_router

__all__ = ["warehouses_router", "photos_router", "objects_router"]
