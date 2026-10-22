def execute_navigate(intent: dict) -> dict:
    """Return navigation action for frontend to handle via router.push()."""
    return {
        "action": "navigate",
        "path": intent.get("path", "/dashboard"),
        "message": f"Taking you to {intent.get('label', 'the page')}...",
    }
