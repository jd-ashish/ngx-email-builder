# Template Builder 🛠️

This is the demonstration and development application for the `ngx-email-builder` library. It serves as both a live preview of the library's capabilities and a boilerplate for developers who want to build their own custom builder application.

## 🚀 Getting Started

### Local Development

This app is configured to consume the library from a local build. For a seamless experience, use the automated sync command from the root directory:

```bash
# Run this from the ROOT directory
npm run app:refresh
```

This will automatically build the library, package it, install it here, and start the development server.

### Manual Setup
If you prefer manual steps:
1. Build the library in the root: `npm run build`
2. Install dependencies in this folder: `npm install`
3. Start the app: `npm start`

---

## 🏗️ Project Structure

- **`src/app/app.ts`**: The main entry point. Shows how to configure the builder and handle events.
- **`src/app/app.html`**: Contains the `<ngx-email-builder>` component integration.
- **`src/styles.css`**: Global styles and theme overrides for the builder.

## 💡 Using as a Boilerplate

You can use this application as a starting point for your own email building platform. 

1. **Custom Branding**: Modify `src/styles.css` to match your brand's color palette.
2. **Event Handling**: Update the `onSaveSuccess` and `onPreview` handlers in `app.ts` to integrate with your own backend or storage service.
3. **Configuration**: Use the `[autoSave]` and `[apiConfig]` inputs on the component to toggle advanced features.

---

## 📄 License
MIT © Ashish Kumar
