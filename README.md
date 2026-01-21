# gh.world — A World of Commits

A real-time 3D globe visualization of public GitHub commits. Watch the pulse of global development as it happens.

[gh.world](https://gh.world) (Coming soon)

## Features

- **Live 3D Globe**: Continuously updating visualization of global GitHub activity using `globe.gl`.
- **Real-time Data Feed**: Polls the GitHub Events API to show the latest `PushEvents` as they happen.
- **Geolocation mapping**: Maps commits to their physical locations (where available) with high-performance caching and Nominatim geocoding.
- **Atmospheric Pulses**: Visualizes activity from commits without precise locations as ambient pulses radiating from random points.
- **Language Visualization**: Commits are color-coded by programming language (Python, JavaScript, Rust, etc.) based on GitHub API data.
- **Smart Filtering**: Filter the globe by specific languages to see where different technologies are most active geographically.
- **Six-Hour Timelapse**: Replay the last 6 hours of global commit activity with adjustable playback speed (1x to 8x).
- **Interactive Stats**: Detailed breakdown of languages, commit counts, and contributor statistics in a sleek sidebar.
- **Modern UI/UX**: Built with a "dark-first" aesthetic, featuring glassmorphism, smooth animations, and native light/dark mode support.

## Tech Stack

- **Frontend**: [Next.js 15](https://nextjs.org/), [React 19](https://react.dev/), [Tailwind CSS](https://tailwindcss.com/)
- **Visuals**: [globe.gl](https://globe.gl/) (Three.js)
- **Backend**: [Convex](https://convex.dev/) (Real-time database, serverless functions, and cron jobs)
- **UI Components**: [Shadcn UI](https://ui.shadcn.com/), [Lucide React](https://lucide.dev/), [Recharts](https://recharts.org/)

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A [Convex](https://convex.dev/) account

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd ghworld
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server (this will also prompt you to log in to Convex):
   ```bash
   npm run dev
   ```

4. Follow the Convex setup instructions in your terminal to create a new project and set up your deployment.

## Project Structure

- `convex/`: Backend schema, mutations, queries, and polling logic.
- `app/`: Next.js application routes, layout, and global styles.
- `components/`: React components, including the 3D Globe, Stats Sidebar, and Timeline controls.
- `lib/`: Shared utility functions, types, and constants.

## Learn More

- [Convex Documentation](https://docs.convex.dev/)
- [Next.js Documentation](https://nextjs.org/docs)
- [React Globe.gl Documentation](https://github.com/vasturiano/react-globe.gl)

---

Built with ❤️ for the developer community.
