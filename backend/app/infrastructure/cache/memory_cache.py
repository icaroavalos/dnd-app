class MemoryCache:
    def __init__(self) -> None:
        self._items: dict[str, object] = {}

    def get(self, key: str) -> object | None:
        return self._items.get(key)

    def set(self, key: str, value: object) -> object:
        self._items[key] = value
        return value
