# QuillCode Electron Desktop Client

This directory contains the Electron wrapper for QuillCode, enabling it to run as a native desktop application.

## Features

- **Native Desktop Experience**: Run QuillCode as a standalone application
- **First-Run Setup Wizard**: Guided configuration for data storage and AI settings
- **Auto Updates**: Automatic updates from GitHub Releases
- **Cross-Platform**: Supports Windows, macOS, and Linux

## Development

### Prerequisites

- Node.js 18+
- npm or pnpm

### Setup

1. Install dependencies in the frontend directory:
   ```bash
   cd frontend
   npm install
   ```

2. Install Electron dependencies:
   ```bash
   cd electron
   npm install
   ```

### Running in Development

1. Start the Vite dev server (in frontend directory):
   ```bash
   cd frontend
   npm run dev
   ```

2. In a separate terminal, start Electron (in electron directory):
   ```bash
   cd electron
   npm run dev
   ```

## Building for Production

### Build Frontend First

```bash
cd frontend
npm run build
```

### Build Electron App

```bash
cd electron

# Build for current platform
npm run build

# Build for specific platforms
npm run build:win    # Windows
npm run build:mac    # macOS
npm run build:linux  # Linux
```

Built applications will be in the `electron/release` directory.

## Configuration

### electron-builder Configuration

The build configuration is in `electron/package.json` under the `build` key:

- **appId**: Application identifier (com.quillcode.app)
- **productName**: Display name (QuillCode)
- **directories.output**: Output directory for builds (release)
- **publish**: GitHub Releases configuration for auto-updates

### Auto-Update Setup

To enable auto-updates:

1. Update the `publish` section in `package.json` with your GitHub repository:
   ```json
   "publish": {
     "provider": "github",
     "owner": "your-username",
     "repo": "quillcode",
     "releaseType": "release"
   }
   ```

2. Create a GitHub personal access token with `repo` scope

3. Set the `GH_TOKEN` environment variable when building:
   ```bash
   GH_TOKEN=your_token npm run build
   ```

4. Publish releases to GitHub:
   ```bash
   GH_TOKEN=your_token npx electron-builder --publish always
   ```

## App Icons

Place your app icons in the `electron/assets` directory:

- `icon.png` - 512x512 PNG for general use
- `icon.ico` - Windows icon (256x256 recommended)
- `icon.icns` - macOS icon
- `icons/` - Linux icons in various sizes (16, 32, 48, 64, 128, 256, 512)

You can generate icons from a single PNG using tools like:
- [electron-icon-builder](https://www.npmjs.com/package/electron-icon-builder)
- [png2icons](https://www.npmjs.com/package/png2icons)

## Security

The Electron app follows security best practices:

- **Context Isolation**: Enabled to prevent renderer access to Node.js
- **Node Integration**: Disabled in renderer process
- **Preload Script**: Exposes only necessary APIs via `contextBridge`
- **External Links**: Opened in system browser, not in app

## File Structure

```
electron/
├── main.js           # Main process entry point
├── preload.js        # Preload script for IPC
├── package.json      # Electron dependencies and build config
├── assets/           # App icons and resources
│   └── .gitkeep
└── README.md         # This file
```

## IPC API

The preload script exposes the following APIs to the renderer:

### Configuration
- `getConfig()` - Get current configuration
- `saveConfig(config)` - Save configuration
- `isFirstRun()` - Check if first run
- `completeFirstRun()` - Mark first run complete

### Dialogs
- `selectDirectory()` - Open directory selection dialog

### App Info
- `getPaths()` - Get app paths (userData, documents, home)
- `getVersion()` - Get app version

### Auto Updater
- `checkForUpdates()` - Check for updates
- `downloadAndInstall()` - Download and install update
- `onUpdateAvailable(callback)` - Listen for update available
- `onDownloadProgress(callback)` - Listen for download progress
- `onUpdateDownloaded(callback)` - Listen for update downloaded
- `onUpdateError(callback)` - Listen for update errors
