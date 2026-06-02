# FutureScaping Planning Visibility Packs

Reusable client-facing evidence packs for planning, landscape visibility, and drone-derived visual assessment work.

This template turns one-off mapping deliverables into a repeatable FutureScaping-style programme:

- a planning question and project summary
- a 3D scene portal for 3DVista, Nira, or similar model viewers
- a viewpoint evidence library
- map layer inspection with orthomosaic, DSM, and contour outputs
- a 360 panorama viewer
- a method and assumptions record
- download links for formal supporting outputs

## Run Locally

From this folder:

```powershell
node server.js
```

Then open:

```text
http://localhost:3095
```

## Repeatable Project Structure

```text
data/projects.json
projects/<project-id>/assets/
projects/<project-id>/viewpoints/
projects/<project-id>/downloads/
```

For a new planning project, copy the `confidential-rural-site` folder, add the exported imagery and viewpoint renders, then create a new project record in `data/projects.json`.

Expected core assets:

- `ortho.jpg`
- `dsm.png`
- `contour.png`
- `panorama.jpg`

Optional planning assets:

- viewpoint existing/proposed images
- 3DVista tour URL
- Nira or web model URL
- planning note/report PDFs

## Viewpoint Renders

Place Blender or 3DVista stills in:

```text
projects/<project-id>/viewpoints/
```

Then add the filenames to the matching viewpoint record in `data/projects.json`:

```json
{
  "existingImage": "church-existing.jpg",
  "proposedImage": "church-proposed.jpg"
}
```

Those images become clickable in the Viewpoints tab and open in a zoomable, pannable review viewer with an in-page full-screen mode.

## Showcase Seed

The first project is seeded from an anonymized rural planning deliverable so the workspace can be used as a portfolio showcase without exposing the live project or client.
