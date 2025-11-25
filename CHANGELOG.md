# Changelog

This log tracks the major features, improvements, and bug fixes that have led to the current stable version.

### **v2.2.0 (Stable)**
-   **Feature:** Added "Quick Select" **Table Management** in settings, allowing full customization of table names for saving tickets.
-   **Feature:** Added an **"Exact Cash"** button to the payment screen for faster one-tap cash transactions.
-   **Improvement:** Centralized the app version number to `2.2.0` for consistency across the UI and data backups.
-   **Critical Bug Fix:** Fixed a major data integrity bug where deleting an item would leave a broken "ghost" item in custom grids. The app now correctly removes the item from all associated layouts.
-   **UI/UX:** Redesigned custom payment buttons on the payment screen to be solid-colored and more prominent.
-   **UI/UX:** Changed the "Quick Select" layout for saving tickets to a more readable vertical list.
-   **Bug Fix:** Re-architected the sync indicator to be a reliable, timed feedback mechanism, fixing the "always rotating" bug and adding a clear offline indicator. The manual sync button was later removed for a cleaner, fully automatic experience.

### **v2.1.0 (Major Refactor & Feature Release)**
-   **Major Feature:** Implemented full **Multi-Factor Authentication** with Google Sign-In and Phone Number (OTP) support.
-   **Major Feature:** Re-architected the ticket system to support **"smart adding,"** where adding the same item consecutively increments its quantity, but adding a different item creates a new, distinct line.
-   **Major Refactor:** Replaced the entire blue theme with a professional **new green theme** for both light and dark modes.
-   **Major Refactor:** Redesigned the **Settings screen** with a modern, tablet-friendly split-view layout.
-   **Major Refactor:** Re-architected app navigation to use a **persistent layout**, eliminating screen transition lag ("jitter") and making the app feel instantaneous.
-   **Major Firebase Optimization:** Drastically reduced server costs and load by removing persistent listeners for low-frequency data (like settings and items) and fetching them only once on startup.
-   **Feature:** Added a one-time **onboarding screen** for new users.
-   **Feature:** Added a smart **"empty state" prompt** on the Sales screen to guide new users to add items.
-   **Feature:** Implemented native **QR code printing** for Instagram handles on receipts.
-   **Critical Bug Fix:** Fixed a severe bug where the active ticket would be **cleared when switching themes** by elevating the ticket state to the global context.
-   **Critical Bug Fix:** Fixed the **"double-add" bug** where a single tap could add an item to the ticket twice.
-   **Critical Bug Fix:** Resolved multiple **app crashes** related to custom grid management by adding robust data validation and refactoring rendering logic.
-   **UI/UX:** Replaced the "remove" icon on grid items with an intuitive **long-press context menu**.
-   **UI/UX:** Redesigned the payment screen to use a large **on-screen numpad** for faster cash entry.
-   **UI/UX:** Redesigned the "Manage" and "All Items" buttons to be compact icon-only buttons to save screen space.

### **v1.0.0 (Initial Foundation)**
-   **Core Feature:** Foundational POS system with Sales, Receipts, and Item Management.
-   **Core Feature:** Initial implementation of custom category grids.
-   **Core Feature:** Full **Firebase integration** with real-time data sync and offline support via Firestore.
-   **Core Feature:** Support for **Bluetooth thermal receipt printing**.
-   **Core Feature:** CSV import/export for items and full JSON data backup/restore functionality.
-   **Core Feature:** Initial Light/Dark theme support.
