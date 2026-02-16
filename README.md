# Welcome to your Lovable project

> **🇸🇦 للحصول على التعليمات باللغة العربية، انظر [README.ar.md](./README.ar.md)**
> 
> **For Arabic instructions, see [README.ar.md](./README.ar.md)**

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## Features

- ✅ **Responsive Design**: Desktop sidebar layout and mobile-friendly bottom navigation
- ✅ **Progressive Web App (PWA)**: Works offline with service worker support
- ✅ **Ambient Sounds**: Built-in rain sound player with volume control for focus and relaxation
- ✅ **Time Tracking**: Easy-to-use timer with project management
- ✅ **RTL Support**: Full Arabic language support with right-to-left layout
- ✅ **Auto-Deployment**: Automatic deployment to GitHub Pages on every push

## Ambient Sounds Setup

The application includes ambient sound features (rain, cafe, brown noise) to help with focus and productivity. 

**Current Setup:**
- The placeholder audio files in `/public` are small test files (1KB each)
- The app automatically falls back to CDN sources when local files are invalid
- For best offline experience, you can replace the placeholder files with full audio files

**To add full audio files:**
1. Download the audio files from:
   - Rain: https://www.soundjay.com/nature/rain-07.mp3
   - Cafe: https://upload.wikimedia.org/wikipedia/commons/a/ab/Ambience_of_a_busy_cafe.mp3
   - Brown Noise: https://cdn.pixabay.com/download/audio/2022/02/03/audio_5131105e4c.mp3
2. Place them in the `/public` directory with exact names: `rain-07.mp3`, `cafe-ambience.mp3`, `brown-noise.mp3`

See `/public/AUDIO_FILES_AR.md` for detailed instructions in Arabic.

## Known Issues & Solutions

### 404 Error on Page Refresh

This project is a Single Page Application (SPA) deployed on GitHub Pages. If you encounter a 404 error when refreshing a page or accessing a direct URL:

**Solution:** The repository includes a `404.html` file that automatically redirects to the correct route. Make sure this file is deployed with your build to GitHub Pages.

**How it works:**
- When GitHub Pages receives a request for a non-existent path (e.g., `/sa3aty-time-tracker/timeline`)
- It serves the `404.html` file
- The `404.html` script stores the path and redirects to `index.html`
- The `index.html` script restores the correct client-side route


## How can I deploy this project?

### GitHub Pages (Recommended)

This project is configured for automatic deployment to GitHub Pages. Every push to the `main` branch will trigger a deployment.

1. Go to your repository settings
2. Navigate to Pages section
3. Under "Build and deployment", select "GitHub Actions" as the source
4. Push changes to the `main` branch
5. Your site will be available at: `https://ahmad-alqattu.github.io/sa3aty-time-tracker/`

### Lovable

Alternatively, you can open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
