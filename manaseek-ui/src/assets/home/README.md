# Beranda illustration

## Header logo

`manaseek-mark.png` is the transparent emblem extracted from `public/logo.png`
using the built-in `imagegen` tool, then resized to 256 × 256 with its alpha
channel preserved. The source keeps the green and gold fills; the home header
renders them uniformly white with `filter: brightness(0) invert(1)`. This keeps
the transparent gaps clean without adding a background tile or wordmark.

Final generation prompt:

> Use case: background-extraction. Asset type: transparent Manaseek brand emblem PNG for a mobile app header. Extract ONLY the upper green-and-gold emblem from the supplied logo. Keep its original green and gold colors and exact original shape: the two curved human figures, their circular heads, pointed top, and the central Kaaba with separate bands. Remove the 'manaseek' wordmark entirely. Remove the white paper background, its texture and ALL white space inside and around the emblem, so those regions are fully transparent. IMPORTANT: retain ONLY the colored green and gold parts; no white pixels, white patches, white paper residue, or shadows in any negative space. Preserve smooth clean contours and proportions without redesign. Center the complete original emblem with a 5 percent transparent margin in a square genuine RGBA PNG. Flat colored shapes with crisp anti-aliased edges, no paper texture or speckles. This colored transparent source will be displayed in white by the app, so keeping the alpha silhouette perfectly clean is critical.

## Current asset: transparent Kaaba

`kaaba-cutout.png` is the current home-card illustration. It was edited from
`kaaba-guide.webp` with the built-in `imagegen` tool and resized to 640 × 640
while preserving its alpha channel. The card positions the cutout at the lower
right, enlarged and clipped by the card edges.

Final edit prompt:

> Use case: background-extraction. Asset type: transparent PNG cutout for the bottom-right corner of a mobile app card. Edit target: the provided Kaaba illustration. Isolate ONLY the Kaaba building: the black cube, its gold kiswah band, gold door and the narrow stone base directly belonging to the cube. Preserve its existing three-quarter perspective, recognizable geometry, black cloth texture, warm gold detailing and soft lighting. Remove the entire cream background, the mosque arches, green dome, crescent, minarets, plants, round pedestal and ground shadows. Output one standalone Kaaba with real RGBA transparency, tightly framed with about 5 percent transparent padding around the full building. The Kaaba should fill the image and be a substantial close-up, not a small miniature surrounded by empty space. Keep the complete cube in the PNG; clipping will be handled by the app. No background color, no drawn checkerboard, no environment, no added text, no UI, no logo or watermark.

## Original illustration

`kaaba-guide.webp` was generated with the built-in `imagegen` tool, then resized
to 640 × 640 and encoded as WebP for the home screen. It is a decorative
illustration, not a representation of the mosque's actual layout.

Final generation prompt:

> Use case: stylized-concept. Asset type: decorative illustration for a compact Indonesian Hajj and Umrah mobile app card. Primary request: a beautifully crafted miniature Kaaba with its authentic black kiswah and restrained gold band, sitting on a small warm ivory marble circular plinth, backed by two simplified ivory mosque arches and a small deep emerald green dome. Style: premium soft 3D clay and paper architectural illustration, rounded edges, matte ceramic, restrained satin gold details, soft ambient shadows. Composition: square image, one cohesive centered arrangement with plenty of space around all edges, all architecture fully visible, no cropping. Three-quarter view, gentle warm studio lighting. Palette: forest green #07533b, gold #c59b4e, warm ivory #fbf7ed, black Kaaba. Background: solid warm ivory #fbf7ed, no texture or gradient. Constraints: no people, no text, no lettering, no calligraphy, no logos, no watermark; culturally respectful recognizable Kaaba; clean silhouette that remains legible at 140px. This is an illustration asset, not a screenshot or interface.
