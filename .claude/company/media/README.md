# Media assets

- images/prompts/ — one prompt file per needed image (run in Gemini/Imagen)
- images/generated/ — drop Gemini output here (filename referenced by asset-manifest)
- video/prompts/ — shot list + Veo prompt per clip
- video/generated/ — drop exported clips here (MP4 + WebM, compressed)
Workflow: media-prompt-director writes prompts -> Founder generates in Gemini ->
Founder saves output to generated/ with the given filename -> asset-manifest resolves.
