# Critical App Safeguards

To ensure the application remains functional and maintains its layout across builds and remixes, the following rules MUST be strictly followed:

## 1. Tailwind CSS v4 Configuration
- **Package**: `@tailwindcss/vite` MUST be present in `package.json` devDependencies.
- **Vite Config**: `vite.config.ts` MUST import and use the `tailwindcss()` plugin from `@tailwindcss/vite`.
- **Remixing Rule**: When remixing an app, MUST ensure all files are copied correctly and no empty files are introduced. This is a primary rule to maintain app integrity.
- **CSS Import**: `index.tsx` MUST import `./index.css`. This is the ONLY way Tailwind v4 styles are applied to the React app.
- **No CDN**: DO NOT add `<script src="https://cdn.tailwindcss.com"></script>` to `index.html`. It is redundant and can cause conflicts with the Vite-processed styles.

## 2. Build Verification
- After ANY change to dependencies or configuration files (`package.json`, `vite.config.ts`, `index.tsx`, `index.css`), you MUST run:
  1. `lint_applet`
  2. `compile_applet`
- If the build fails, investigate missing dependencies or incorrect imports immediately.

## 3. Preservation of Core Layout
- The `index.css` file contains critical theme variables and Tailwind directives. DO NOT modify or delete these unless explicitly requested.
- The `index.tsx` file's import of `index.css` is MANDATORY.

## 4. Environment Variables
- Ensure `GEMINI_API_KEY` is correctly handled in `vite.config.ts` via the `define` block.

Failure to follow these rules will result in a broken layout or application failure.
