# Minimal matte 3D icons

The current icon family was regenerated with the built-in `image_gen` tool. The objects use solid, opaque matte materials, simple shapes, muted Manaseek green, ivory, and occasional subdued ochre accents. Glassmorphism belongs to the UI containers in `styles/design.css`, not the raster objects.

All twelve final assets are transparent 192 × 192 WebP images (quality 88, alpha quality 100). They replace the earlier glossy assets at the same paths and are shared by every screen through `components/artwork.js`. The brand mark and large Kaaba hero illustration are separate assets.

## Asset paths

- [umrah.webp](home/services/umrah.webp)
- [hajj.webp](home/services/hajj.webp)
- [chat.webp](home/services/chat.webp)
- [mutawif.webp](home/services/mutawif.webp)
- [qibla.webp](home/services/qibla.webp)
- [checklist.webp](home/services/checklist.webp)
- [travel.webp](home/services/travel.webp)
- [profile.webp](home/services/profile.webp)
- [home.webp](illustrations/home.webp)
- [ihram.webp](illustrations/ihram.webp)
- [tawaf.webp](illustrations/tawaf.webp)
- [notification.webp](illustrations/notification.webp)

## Final prompt set

Each image was generated in its own tool call with the shared prompt followed by its subject.

### Shared style

Use case: stylized-concept. Asset type: one minimalist 3D UI icon for Manaseek, a calm Hajj and Umrah mobile app. Visual style: simple softly sculpted SOLID MATTE objects, like unglazed colored clay. Use a few broad geometric forms, shallow dimensional depth, gently rounded corners, flat uniform base colors and very soft diffuse shading. Material is fully opaque with high roughness and NO shine. Palette: muted forest green #3D6852, pale sage #B9C9B9, warm ivory #F1EFE6; occasional tiny muted ochre #BEA36A accent, NOT metallic. Charcoal only for the Kaaba. Camera: orthographic subtle three-quarter view, 12-degree view from above, front and a small right side visible. Lighting: broad soft light from upper left, gentle ambient occlusion between shapes, low contrast. Composition: single centered icon occupying 78 percent of a square canvas, generous even clear padding, simple silhouette legible at 40px. Genuine transparent RGBA background. This is only the object; the app supplies its own glass container. No glass materials, translucent parts, glossy enamel, metallic gold, reflective highlights, glowing edges, gradients painted onto the object, dramatic rim light, ornate trim, realistic microtexture, gemstones, decorations, floating particles, platform, badge-shaped background, frame, floor, backdrop, ground shadow, writing, calligraphy, watermark, or icon sheet. 

### umrah

Subject: a simple charcoal Kaaba cube with very slightly rounded corners, one narrow flat muted-ochre band near the top and one small flat ochre door. Only three clean colored geometric pieces. Smooth matte surface, no brick lines, no inscriptions, no ornamentation, no cloth grain, no gold reflections.

### hajj

Subject: a simple open guidebook with a muted forest-green cover, two thick ivory page blocks and one tiny flat ochre bookmark at the center. No text, no page symbols, no individual page lines. A clean three-dimensional book silhouette with softly rounded edges.

### chat

Subject: one single thick rounded forest-green speech bubble with a short tail and three small ivory inset circular dots. No second bubble, no golden border, no sparkles, no stand. Simple matte clay speech bubble.

### mutawif

Subject: a simple featureless human guide bust with a warm ivory spherical head, a plain forest-green kufi cap, and forest-green rounded shoulders. One small pale-sage disk at the lower right shoulder bears a simple dark-green checkmark. No face, no clothing folds, no patterns or trim, no metallic badge.

### qibla

Subject: a simple round pale-sage compass body with an opaque warm ivory dial, one forest-green triangular needle with a tiny muted ochre reverse tip, and four tiny dark-green tick marks. Very slim rim, no glass cover, no raised ornamental ring, no letters, no numbers. The dial is clearly visible.

### checklist

Subject: a simple rounded forest-green clipboard, one flat ivory paper sheet, one small muted-ochre top clip, and exactly three dark-green checkmarks each followed by one short thin line. Very shallow extruded form, no raised chunky lettering, no tiny details, no page words.

### travel

Subject: a small plain forest-green rolling suitcase with softly rounded corners, a simple sage telescopic handle and two small dark-green wheels. A single shallow vertical seam on the front. No metal trim, no luggage tag, no gold frame, no decorative ridges, no additional objects.

### profile

Subject: a plain universal account avatar consisting of just one muted forest-green sphere for a head and a simple rounded shoulder shape beneath it. Tiny separation between head and shoulders. Solid matte clay, no face, no clothing, no collar, no gold accents, no base, no frame.

### home

Subject: one miniature minimalist house, an ivory cuboid wall body with a muted forest-green pitched roof and one simple forest-green recessed door. One tiny square window. No chimney, no gold trim, no ornate arches, no steps, no window crossbars. Only large simple matte forms.

### ihram

Subject: two neatly folded ivory cloth layers, offset slightly so both rounded folds are visible, resting against each other. Smooth minimal stylized matte fabric, no microtexture or fringes. One narrow plain pale-sage packing band around the cloth, no buckle, no perfume or extra items.

### tawaf

Subject: a small simple charcoal Kaaba cube with narrow flat muted-ochre top band and one tiny ochre door, surrounded at its base by one slim pale-sage oval orbit. The orbit is a smooth plain ring without any arrowhead, to convey circulation without specifying direction. No inscriptions, no bricks, no shiny surfaces.

### notification

Subject: one simple softly rounded forest-green bell with a small sage top nub and a tiny muted ochre clapper underneath. Plain bell body with no ornamental rim, no large ring handle, no metallic band, no badges or numbers.

