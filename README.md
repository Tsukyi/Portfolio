# Boon Kiat — Portfolio

A responsive, dependency-free portfolio hosted on GitHub Pages.

## Preview locally

From this folder run `python -m http.server 8080`, then open `http://localhost:8080`. You can also open `index.html` directly; clipboard access may be unavailable without HTTPS or localhost.

## Edit

- `index.html`: biography, project links, coursework and contact details.
- `styles.css`: layout, light/dark colour tokens, responsive styles and motion.
- `theme.js`: applies a saved theme before the page renders.
- `script.js`: theme controls, project filters, navigation, quick jump, number game and email copying.
- `favicon.svg`: the portfolio mark.

All artwork and project previews are built with HTML/CSS/SVG. The Habitz terminal is a labeled visual sketch, not a product screenshot. No external fonts, analytics or JavaScript libraries are loaded. Existing biography, course codes and public project links were retained from the previous portfolio.

Use **Ctrl+K / Command+K** for quick navigation. The number game supports Enter, counts attempts, and remembers a personal best. Theme preferences also persist locally. Reduced-motion preferences are respected; content stays visible with JavaScript disabled.

Verified JavaScript syntax, internal links, asset references, unique element IDs and safe new-tab links. Rendered desktop/mobile browser verification remains outstanding because a browser binary was unavailable in the editing environment.
