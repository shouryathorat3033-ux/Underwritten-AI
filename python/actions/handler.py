from actions.navigate import execute_navigate
from actions.create import execute_create


async def handle_action(intent: dict, req) -> dict:
    """Route classified intent to the appropriate action handler."""
    action_type = intent["type"]

    if action_type == "navigate":
        return execute_navigate(intent)

    if action_type == "create":
        return await execute_create(intent, req)

    if action_type == "delete":
        return {"action": "error", "message": "Delete is not supported via chat. Please use the dashboard."}

    if action_type == "autofill":
        return {"action": "navigate", "path": "/dashboard/assess", "message": "Taking you to the assessment form..."}

    return {"action": "error", "message": "I'm not sure how to help with that. Try asking a question instead."}
