# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

## Running with a Desktop shortcut (Windows)

You can start the app by double-clicking instead of using a terminal:

1. **One-time setup:** double-click `Create-Desktop-Shortcut.bat`. This adds a
   **Recipe Book Creator** shortcut to your Desktop.
2. **Every time you want to use the app:** double-click that Desktop shortcut
   (or run `launch-recipe-book.bat` directly).

The launcher installs dependencies the first time, starts the Vite dev server,
and opens `http://localhost:5173/` in your default browser. Close the launcher
window (or press `Ctrl+C` in it) to stop the app.

> Requires [Node.js](https://nodejs.org/) to be installed.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
