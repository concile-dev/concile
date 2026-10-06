---
"@concile/query-engine": patch
---

`paginate` now clamps the client-supplied cursor to the query's own index range. A forged cursor
(or one from a different query) could previously move the scan's start or end outside the range
the query's `eq`/range constraints define, returning rows the query should never see. An
out-of-range cursor now yields the first page or an empty one.
