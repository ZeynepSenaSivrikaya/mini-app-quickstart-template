# Base Mini App Quickstart

This is a **Mini App** template built using [OnchainKit](https://onchainkit.xyz) and the [Farcaster SDK](https://docs.farcaster.xyz/). It is designed to help you build and deploy a Mini App that can be published to the [Base App](https://www.base.dev) and Farcaster.

> [!IMPORTANT]
> This is a workshop template. Please follow the instructions below to configure and deploy your app.

## Prerequisites

Before getting started, make sure you have:

*   A [Farcaster](https://farcaster.xyz/) account (for testing)
*   A [Vercel](https://vercel.com/) account for deployment
*   A [Coinbase Developer Platform](https://portal.cdp.coinbase.com/) Onchainkit Client API Key
*   Basic knowledge of [Base Build](https://www.base.dev) platform

## Getting Started

### 1. Fork & Clone & Install

* Fork this [repository](https://github.com/Trio-Blockchain-Labs/mini-app-quickstart-template.git)
* After forking, clone your forked template project
```bash
git clone https://github.com/[your_username]/[your_forked_repository_name].git
cd [your_forked_repository_name]
npm install
```

### 2. Configure Environment

Create a `.env` file based on `.example.env`:

```bash
NEXT_PUBLIC_ONCHAINKIT_API_KEY=<YOUR-CDP-API-KEY>
NEXT_PUBLIC_URL=http://localhost:3000
```

### 3. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your app.

## Customization

### Minikit Configuration

The `minikit.config.ts` file configures your app's manifest.

1.  Open `minikit.config.ts`.
2.  Update `name`, `subtitle`, and `description` to match your app idea.
3.  **Note:** Skip the `accountAssociation` for now; we will add this after deployment.
**IMPORTANT:** Follow [manifest](https://docs.base.org/mini-apps/core-concepts/manifest) documentation for configuring your app's manifest

**Note:** You can update manifest metadata of your app after **deployment** if you don't have an idea yet.

## Assets: Video & Mood Images (Braver Beaver)

To use the custom intro video and mood icons in the home screen, place files under the `public/` folder:

- Put your MP4 video at: `public/intro.mp4` (the homepage will autoplay this video as a background)
- Optional poster image for browsers that don't autoplay: `public/intro-poster.jpg`
- Mood images (optional). If you want the custom graphics to show on each mood button, place them as:
	- `public/moods/cry.png`
	- `public/moods/happy.png`
	- `public/moods/sweat.png`
	- `public/moods/sleep.png`
	- `public/moods/love.png`
	- `public/moods/fire.png`

If the mood images are not provided, the app will show emoji fallbacks on the buttons.

After adding the files, restart the dev server if needed:

```bash
npm run dev
```


## Deployment

### 1. Deploy to Vercel

```bash
vercel --prod
```
**or** 

Use the [Vercel](https://vercel.com/) website and add your repository as a new project.

### 2. Update Production Env

In your Vercel project settings, add:

*   `NEXT_PUBLIC_ONCHAINKIT_API_KEY`
*   `NEXT_PUBLIC_URL` (Your [Vercel](https://vercel.com/) deployment URL)

## Base Build & Publishing

To publish your app to the Base App ecosystem:

1.  Go to [Base Build](https://www.base.dev) and log in.
2.  Click **Mini App Tools** button at top right of the website.
3.  Paste your deployed website link provided by Vercel into the field.
4.  Use the **Account Association** tools on Base Build to sign your manifest.
5.  Update `minikit.config.ts` with the signature and redeploy.

For detailed docs, visit [docs.base.org](https://docs.base.org/docs/mini-apps/quickstart/create-new-miniapp/).

---

## Disclaimer

This project is a **demo application** for educational purposes only.
