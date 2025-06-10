from fastapi import APIRouter, HTTPException
from src.data.cache import get_cache
from typing import Any, List

router = APIRouter(
    prefix="/cached-analysis",
    tags=["Cached Analysis"]
)

@router.get("/results/{cache_key}")
async def get_cached_analysis_result(cache_key: str) -> Any:
    """
    Retrieve a cached analysis result by its key.
    """
    cache = get_cache()
    result = cache.get_analysis_results(cache_key)
    if result is None:
        raise HTTPException(status_code=404, detail="Analysis result not found for this key.")
    return result

@router.get("/available-results-keys", response_model=List[str])
async def list_available_cached_results_keys() -> List[str]:
    """
    List all available keys for cached analysis results.
    """
    cache = get_cache()
    # Direct iteration over diskcache.Cache keys
    # The _analysis_results_cache attribute is a diskcache.Cache object
    if hasattr(cache, '_analysis_results_cache') and cache._analysis_results_cache is not None:
        try:
            # Ensure the cache directory has been initialized if it's done lazily
            # For diskcache.Cache, keys() method is efficient.
            keys = list(cache._analysis_results_cache.iterkeys())
            return keys
        except Exception as e:
            # Log the exception for debugging
            # logger.error(f"Error accessing cache keys: {e}")
            raise HTTPException(status_code=500, detail=f"Could not retrieve cache keys: {str(e)}")
    else:
        # This case should ideally not happen if Cache is initialized correctly
        raise HTTPException(status_code=500, detail="Analysis cache is not available.")
