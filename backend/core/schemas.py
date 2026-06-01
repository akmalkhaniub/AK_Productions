"""
Typed output guardrails for agent terminal tools.

Agents validate the model's `submit_*` arguments against these before
accepting them. On failure the validation error is fed back to the model as a
tool observation so it can correct and re-submit (a re-ask loop), instead of
shipping malformed data to the UI.
"""
from pydantic import BaseModel, Field, ValidationError  # noqa: F401 (re-exported)


class BreakdownElement(BaseModel):
    category: str
    item: str
    scene: str = ""
    cost_est: str = ""
    notes: str = ""


class ScriptBreakdownResult(BaseModel):
    script_title: str
    total_scenes: int = Field(ge=0)
    speaking_roles: int = Field(ge=0)
    estimated_budget_range: str
    elements: list[BreakdownElement] = Field(min_length=1)


class BriefSection(BaseModel):
    channel: str
    video_title: str = ""
    video_url: str = ""
    summary: str
    why_it_matters: str


class IntelBriefResult(BaseModel):
    headline: str
    sections: list[BriefSection] = Field(default_factory=list)


class ShowrunnerPlan(BaseModel):
    summary: str
    steps_taken: list[str] = Field(default_factory=list)
    recommendations: list[str] = Field(default_factory=list)


def validate(model: type[BaseModel], data: dict):
    """Return (instance, None) on success or (None, error_message) on failure."""
    try:
        return model.model_validate(data), None
    except ValidationError as e:
        return None, "; ".join(f"{'.'.join(str(x) for x in err['loc'])}: {err['msg']}" for err in e.errors())
