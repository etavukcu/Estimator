# Landing photo slots (swap-ready)

These files are **temporary SVG placeholders**. Do not treat them as approved
finished-work photos. Do not copy unapproved Drive images into this folder.

## Approved so far (file not attached yet)

Eray approved one subject: a **primary bathroom** (vanity + frameless glass
shower + shiplap). The follow-up file name is:

`public/assets/projects/bathroom-finished.jpg`

That JPEG is **not in the repo yet**. Until it is dropped in a later message,
the bathroom card and recent-bathroom slot keep the SVG placeholder.

After `bathroom-finished.jpg` lands:

1. Set `bathroom.src` (and optionally `recentBathroom.src`) in
   `src/landingAssets.ts` to `APPROVED_BATHROOM_PHOTO`.
2. Leave `LANDING_PHOTOS_APPROVED` false until every landing slot has an
   approved photo, or only flip per-slot `src` for bathroom.

## Slot map

| Slot | Placeholder now | Drop-in when approved |
| --- | --- | --- |
| Kitchen card | `kitchen.svg` | *(not approved yet)* |
| Bathroom card | `bathroom.svg` | `bathroom-finished.jpg` |
| Mother-in-Law Suite card | `mil-suite.svg` | *(not approved yet)* |
| Home Addition card | `home-addition.svg` | *(not approved yet)* |
| Recent work — kitchen | `recent-kitchen.svg` | *(not approved yet)* |
| Recent work — bathroom | `recent-bathroom.svg` | `bathroom-finished.jpg` |
| Recent work — living space | `recent-living-space.svg` | *(not approved yet)* |
