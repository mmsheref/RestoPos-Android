# Restaurant POS

A modern, high-performance, touch-frienddly Point of Sale (POS) system designed for fast-paced restaurant environments. Built with a focus on speed, reliability, and offline capability.

## Features

*   **Ultra-Fast Sales Screen**: Instantly add items to a ticket from customizable grids.
*   **Receipt History**: Browse, search, and reprint past receipts with infinite scroll.
*   **Item Management**: Easily create, update, and delete menu items, including images and categories.
*   **Offline-First**: The app works seamlessly offline, automatically syncing data when a connection is restored.
*   **Data Management**: Import/export items via CSV and perform full JSON backups/restores.
*   **Settings**: Configure tax rates, printers (Bluetooth), store information, and receipt details.
*   **Authentication**: Secure user login and signup powered by Firebase Auth.
*   **Responsive Design**: A clean UI that works on tablets and desktops, with light and dark modes.
*   **Performance Optimized**: Every interaction is designed to be instant, with UI responses under 16ms.

## Tech Stack

*   **Frontend**: React, TypeScript, Tailwind CSS
*   **State Management**: React Context API
*   **Backend & Database**: Firebase (Firestore, Authentication)
*   **Mobile**: Capacitor

## Performance & Architecture

This application is built with a focus on raw speed and reliability in a demanding retail environment. Key architectural patterns include:

*   **Offline-First**: Using Firestore's built-in IndexedDB caching, the app remains fully functional without an internet connection. Writes are queued and reconciled automatically.
*   **Local State Mirroring**: A central `AppContext` holds the application's state. Components read from this fast, local mirror, decoupling the UI from database latency.
*   **Strategic Listeners**: To minimize Firestore reads and costs, we only listen to a small subset of real-time data (e.g., the last 25 receipts). Older data is paginated on demand.
*   **Optimistic UI**: Actions like adding items or completing a sale update the UI instantly. The data syncs to the backend in the background.
*   **UI Optimizations**: Techniques like debounced search and memoization (`useMemo`) are used to prevent re-renders and keep the UI snappy.

## Getting Started

### Prerequisites

*   Node.js (v18 or later)
*   npm or yarn
*   A Firebase project

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd restaurant-pos
    ```

2.  **Install dependencies:**
    This project uses an `importmap` in `index.html` for dependency management, so a traditional `npm install` is not required for web development.

3.  **Configure Firebase:**
    *   Create a Firebase project at [firebase.google.com](https://firebase.google.com/).
    *   Enable Firestore and Authentication (Email/Password).
    *   Create a new Web App in your Firebase project settings.
    *   Copy the `firebaseConfig` object and paste it into `firebaseConfig.ts`.

4.  **Run the development server:**
    You can serve the project directory with any simple static server. For example, using `serve`:
    ```bash
    npx serve .
    ```
    The app will be available at a local URL provided by the server.

### Building for Mobile (Capacitor)

1.  **Initialize Capacitor (if not already done):**
    ```bash
    npm init -y
    npm install @capacitor/core @capacitor/cli
    npx cap init
    ```

2.  **Add mobile platforms:**
    ```bash
    npx cap add android
    npx cap add ios
    ```

3.  **Sync the web build to the native projects:**
    Ensure your `capacitor.config.json`'s `webDir` points to the root directory (`.`).
    ```bash
    npx cap sync
    ```

4.  **Run on a device or emulator:**
    ```bash
    npx cap run android
    # or
    npx cap run ios
    ```

## Project Structure

```
/
├── components/       # Reusable UI components (modals, layout, etc.)
├── context/          # AppContext for global state management
├── hooks/            # Custom React hooks (useDebounce, etc.)
├── screens/          # Top-level screen/page components
├── utils/            # Helper functions (CSV, printing, etc.)
├── App.tsx           # Main app component with routing
├── firebase.ts       # Firebase initialization and core functions
├── index.html        # Main HTML entry point with importmap
├── index.tsx         # App entry point
└── types.ts          # TypeScript type definitions
```
