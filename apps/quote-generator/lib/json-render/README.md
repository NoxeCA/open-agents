# json-render for Noxe quotes

Declarative, catalog-based PDF composition for Noxe quote/proposal documents.
The strict `POST /api/quote` endpoint remains unchanged. Specs authored
against the catalog below render through `POST /api/quote/render`.

## Quickstart

```bash
curl -X POST http://localhost:3000/api/quote/render \
  -H 'x-api-key: $API_KEY' \
  -H 'Content-Type: application/json' \
  --data @scripts/test-data/json-render/cover-only.json \
  --output /tmp/quote.pdf
```

Get the LLM-friendly catalog manifest:

```bash
curl 'http://localhost:3000/api/quote/render/catalog?format=prompt' \
  -H 'x-api-key: $API_KEY' > catalog.md
```

## Envelope

```jsonc
{
  "version": 1,
  "brand": {
    "company": { "phone": "1 800 555 0000" },
    "translations": "en"
  },
  "variables": { /* ...any data your spec references... */ },
  "attachments": [
    { "filename": "datasheet.pdf", "base64Content": "..." }
  ],
  "document": {
    "type": "Document",
    "lang": "en",
    "children": [ /* Page[] or ServiceSection[] */ ]
  }
}
```

- `version`: always `1` for now.
- `brand`: partial overrides for company info and translations. **Assets (logos,
  hex patterns) are never accepted in the envelope**; they are resolved from
  `/public` by key. See `lib/json-render/env.ts` for the asset registry.
- `variables`: free-form data referenced by `$state` / `$repeat` / `$template`.
- `attachments`: PDFs appended to the final document via pdf-lib.
- `document.children`: `Page` and `ServiceSection` nodes (ServiceSection emits
  1–3 pages of its own).

## Bindings

- `{ "$state": "variables.foo.bar" }` — dotted-path lookup. Missing paths
  resolve to `undefined` (required Zod fields will fail with a clear error).
- `{ "$template": "Hello {{clientName}}" }` — mustache substitution.
- `{ "$cond": { "if": "path", "then": <node>, "else": <node> } }`
- `{ "$repeat": { "over": "variables.items", "as": "item", "template": <node> } }`
  — expands inline into the parent array. The scope exposes `@index`.

## Catalog

Get the full shape with descriptions from the catalog endpoint. Categories:

| Category    | Components |
|-------------|------------|
| layout      | `Document`, `Page`, `HStack`, `VStack`, `Section`, `Spacer`, `Divider`, `Box` |
| typography  | `Heading`, `Subheading`, `Paragraph`, `Label`, `Caption` |
| brand       | `DarkHeaderBox`, `SectionHeader`, `TocEntries` |
| content     | `Image`, `BulletList`, `ValuePillGrid` |
| table       | `BomTable`, `LaborBlock` |
| composite   | `CoverBlock`, `TaxDisclaimer`, `TotalCostBox`, `SummaryTable`, `InfoGrid`, `SignatureBlock`, `ContinuationHeader`, `TeamCard`, `PartnerGrid`, `ServiceSection` |

## Page-number / TOC pattern

Tag each page with `sectionId`:

```json
{ "type": "Page", "sectionId": "aboutUs", "children": [...] }
```

Reference from `TocEntries`:

```json
{ "type": "TocEntries",
  "entries": [
    { "label": "About Us", "sectionId": "aboutUs" }
  ],
  "combine": [
    { "label": "Extensive Service Offering",
      "sectionIds": ["service-1", "service-2", "service-3"] }
  ]
}
```

Page ranges are auto-computed via a two-pass render. Authors never write
markers.

## Limits

| Limit         | Value      |
|---------------|------------|
| body size     | 1 MiB      |
| tree depth    | 32         |
| node count    | 2000       |
| render time   | 30 seconds |

Exceeding any returns `413` with `{ error, limit, actual }`.

## Error shape

```jsonc
{
  "error": "Spec validation error",
  "stage": "schema" | "binding" | "render",
  "details": [ { "path": "...", "message": "..." } ]
}
```
