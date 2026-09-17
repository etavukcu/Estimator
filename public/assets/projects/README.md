# Landing photo slots (swap-ready)

These files are **temporary placeholders**, not approved finished-work photos.
Do not treat current images as the final kitchen / bathroom / suite / addition shots.

When Eray picks photos, drop replacements here using the same basenames, then
point `src` in `src/landingAssets.ts` at the new files and set
`LANDING_PHOTOS_APPROVED` to `true`.

| Slot | Placeholder now | Preferred drop-in name |
| --- | --- | --- |
| Kitchen card | `kitchen.svg` | `kitchen.jpg` |
| Bathroom card | `bathroom.svg` | `bathroom.jpg` |
| Mother-in-Law Suite card | `mil-suite.svg` | `mil-suite.jpg` |
| Home Addition card | `home-addition.svg` | `home-addition.jpg` |
| Recent work — kitchen | `recent-kitchen.svg` | `recent-kitchen.jpg` |
| Recent work — bathroom | `recent-bathroom.svg` | `recent-bathroom.jpg` |
| Recent work — living space | `recent-living-space.svg` | `recent-living-space.jpg` |

PNG or WebP is fine; update the `src` extension in `landingAssets.ts`.
