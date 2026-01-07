# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Android APK (Capacitor)

This repo includes a Capacitor Android wrapper so the React app can be shipped as an APK.

### Configure backend URL

For Android/WebView builds you must use an absolute API base URL.

1) Create `frontend/.env` (copy from `.env.example`)
2) Set:

```bash
VITE_API_BASE_URL=https://your-api-domain.com/api/v1
# or for LAN/dev:
# VITE_API_BASE_URL=http://192.168.0.50:8000/api/v1
```

### Build + sync Android

```bash
cd frontend
npm run build
npx cap sync android
```

### Open Android project

```bash
cd frontend
npx cap open android
```

Then in Android Studio:

- **Debug APK**: Build > Build Bundle(s) / APK(s) > Build APK(s)
- **Release**: Build > Generate Signed Bundle / APK...

Note: `android:usesCleartextTraffic="true"` is enabled for dev HTTP backends. For production, prefer HTTPS.
