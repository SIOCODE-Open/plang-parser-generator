# Notes

* Regex to extract `matches` from entity arguments:

```
(?:matches)\s+(\/(?:(?:[^/\\])+(?:\\\/|\\)?)+\/)
```

* Regex to extract `gt`, `ge`, `lt`, `le` from entity arguments:

```
([<>]=?)\s+([-]?[\s0-9]+)
```
