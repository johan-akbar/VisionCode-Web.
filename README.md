# VisionCode Web

A static front-end with a Cloudflare Pages Function proxy. The OpenAI API key is stored as a server-side secret and is never exposed to browser JavaScript.

## Deploy without a credit card (Cloudflare Pages)

1. Create a GitHub repository, for example `VisionCode-Web`.
2. Upload all files and folders from this project to the repository root. Keep `functions/api/generate.js` at exactly that path.
3. In Cloudflare, open **Workers & Pages → Create → Pages → Connect to Git** and connect the repository.
4. Framework preset: **None**. Build command: leave blank. Build output directory: `/` (if the dashboard requires a directory, use the repository root setting supported by the Pages flow).
5. Deploy the project.
6. In the Pages project, open **Settings → Variables and Secrets** (or **Settings → Environment variables**) and add:
   - `OPENAI_API_KEY` = your OpenAI secret key (mark as Secret / encrypted).
   - `OPENAI_MODEL` = `gpt-4.1-mini` (optional).
7. Redeploy so the Function receives the variables.
8. Open the deployed `*.pages.dev` site and test with a small screenshot.

## Important
- Never put the OpenAI key in `app.js`, `index.html`, or any public repository file.
- OpenAI API billing is separate from ChatGPT subscription. API requests may incur charges.
- Video processing happens in the browser: four representative frames are extracted and sent for analysis. It does not upload the full video to OpenAI.
- This project generates front-end code, not a full production backend for any features shown in the reference.
- Keep image files small. The demo accepts images up to 10 MB and videos up to 30 MB; the server limits each extracted frame payload.
