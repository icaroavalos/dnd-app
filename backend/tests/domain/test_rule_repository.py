from app.domain.rules.rule_repository import RuleRepository
from app.domain.rules.rule_schema import normalize_rule_atom


def test_rule_repository_indexes_rules_by_type() -> None:
    repository = RuleRepository(
        [
            {
                "uuid": "feature:sample",
                "type": "feature",
                "metadata": {"version": "5.5e", "tags": []},
            }
        ]
    )

    assert repository.size == 1
    assert repository.find_by_type("feature")[0]["uuid"] == "feature:sample"


def test_rule_repository_tracks_validation_errors_and_tag_queries() -> None:
    repository = RuleRepository()

    assert repository.add_rule({"uuid": "bad", "type": "unknown"}) is False

    spell = normalize_rule_atom(
        {"name": "Bless", "source": "PHB"},
        "spell",
        {"tags": ["spell", "support"]},
    )
    assert repository.add_rule(spell) is True

    assert repository.validation_errors[0]["uuid"] == "bad"
    assert repository.get(spell["uuid"]) == spell
    assert repository.find_by_tag("support") == [spell]
