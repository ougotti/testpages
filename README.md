# testpages

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app) and configured for deployment to GitHub Pages.

## GitHub Pages Deployment

This application is automatically deployed to GitHub Pages using GitHub Actions. The deployment workflow runs when changes are pushed to the `main` branch.

### Configuration

The application is configured for static export with the following settings:
- Static export enabled (`output: 'export'`)
- Base path set for GitHub Pages (`/testpages`)
- Image optimization disabled for static hosting
- Trailing slashes enabled for better compatibility

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the application for production
- `npm run export` - Build and export the application as static files
- `npm run lint` - Run ESLint to check code quality

## Deployment

The application is automatically deployed to GitHub Pages when changes are pushed to the main branch. The deployment process:

1. Builds the Next.js application
2. Exports it as static files
3. Deploys to GitHub Pages

The live site will be available at: `https://ougotti.github.io/testpages/`

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
- [Next.js Static Export](https://nextjs.org/docs/app/building-your-application/deploying/static-exports) - information about static exports

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!
