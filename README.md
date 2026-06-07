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

## Deploy To Render

This project should be deployed at the root of the site, not inside a subfolder. That means the live URL should look like:

```text
https://your-project.onrender.com/
```

and not:

```text
https://your-project.onrender.com/some-subfolder/
```

That matters because the 3DVista hotspot links use root-relative paths such as:

```text
/viewer-bridge.html?src=/projects/...
```

### Idiot-Proof Render Steps

1. Push this repo to GitHub.
2. Log into Render.
3. Click `New +`.
4. Choose `Blueprint`.
5. Connect the GitHub repo for this project.
6. Let Render read the included [render.yaml](./render.yaml).
7. Confirm the new web service.
8. Wait for the first deploy to finish.
9. Open the Render URL and test:
   - home page loads
   - `3D Scene` links open
   - `3DVista` loads
   - a hotspot using `/viewer-bridge.html?...` opens over the app instead of as a raw image

### Render Settings Used

If Render asks you to enter them manually, use:

```text
Runtime: Node
Build Command: npm install
Start Command: npm start
```

### Before You Go Live

- Make sure the 3DVista hotspots are using the `viewer-bridge.html` URLs from:
  `projects/confidential-rural-site/references/3dvista-hotspot-urls.md`
- Keep the app at the site root on Render.
- Test at least one normal image hotspot and the combined `4/5` hotspot after deployment.

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
