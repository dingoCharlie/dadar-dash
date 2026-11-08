# Dadar Dash

Mobile-first browser game inspired by navigating crowds at Mumbai's Dadar station.

## Latest version: v21

- Survival-only gameplay
- Floating joystick; tap anywhere and drag to move, release to hide
- 140 px drag distance for full speed
- Rounded corridor appearance with classic route geometry
- Edge-aware camera to improve visibility near the corridor sides

**Live game:** https://dadar-dash-abhishekbatni-6306.vercel.app

## Run locally

Open `index.html` in a browser. No build step is needed.

## Automated checks

```sh
npm install
npx playwright install chromium
npm test
```

These are basic browser/regression checks, not a physical-device performance test or a measurement of win rate.

## Deployment

The existing Vercel `dadar-dash` project hosts production. Link this repository to the **existing** project using the Vercel dashboard's Settings → Git page. Do not create another Vercel project. Keep production updates gated on successful QA.
