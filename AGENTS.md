<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## App architecture
- Keep the cycle phase data in a browser-safe shared module and load the Three.js scene inside an effect, so SSR never initializes WebGL.
- The current Ritu interface is an explicitly labelled frontend preview; keep health entries in transient React state until authenticated Cloud persistence is requested.
- Express visual styling through the global semantic design system and use the shared Button for interactive controls.
- AI answers come from a server function that builds a prompt from cycle context and calls the AI gateway; keep the key and safety rules server-side.
- Keep phase-specific check-in definitions and answer selection in a browser-safe shared module so the UI and rule tests use the same source.
