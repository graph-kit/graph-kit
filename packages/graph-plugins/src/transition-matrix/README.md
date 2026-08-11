# transitionMatrix

Turns the node and edge lists into a node-by-node matrix of exact fractions, for Markov-chain style work.

| Export             | Dependencies | Optional dependencies |
| ------------------ | ------------ | --------------------- |
| `transitionMatrix` | none         | none                  |

**Controls:** the plugin's controls are the matrix getter itself, called as `controls.transitionMatrix()`.

Rows and columns are indexed by position in `nodes()`, the same order `nodeIdToIndex` reports, so an index taken against the matrix and the matrix itself come from one list. An edge whose source or target is not in `nodes()` contributes nothing.
