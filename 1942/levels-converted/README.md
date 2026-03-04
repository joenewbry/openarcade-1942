# Level Data Migration (T014)

This directory holds converted level JSON files generated from legacy files in `1942/levels/`.

## Convert All Legacy Levels

```bash
node 1942/tools/integration/convert-legacy-levels.js \
  --input 1942/levels \
  --output 1942/levels-converted
```

Notes:
- Validation is enabled by default and fails conversion on structural/schema errors.
- Use `--no-validate` only for debugging.

## Convert One File

```bash
node 1942/tools/integration/convert-legacy-levels.js \
  --input 1942/levels/coral_front.json \
  --output 1942/levels-converted/coral_front.json
```

## Validate Converted Outputs

Validation runs during conversion. To re-check all files without changing legacy source files, rerun the batch command above.

## Rollback Strategy

1. Keep `1942/levels/` as the source of truth during migration.
2. If converted output is incorrect, delete only the affected file(s) in `1942/levels-converted/`.
3. Re-run conversion from `1942/levels/` after fixing converter logic.
4. If needed, remove all converted files and regenerate:

```bash
find 1942/levels-converted -name '*.json' -delete
node 1942/tools/integration/convert-legacy-levels.js --input 1942/levels --output 1942/levels-converted
```
