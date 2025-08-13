# QBCC Home Warranty Insurance Calculator

A web application for calculating QBCC home warranty insurance premiums for new construction and renovations based on the July 2020 premium table.

## Development

### Prerequisites

- Node.js 18+
- npm or yarn

### Setup

1. Clone the repository
2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`
3. Start the development server:
   \`\`\`bash
   npm run dev
   \`\`\`
4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Environment Variables

- `NEXT_PUBLIC_GTM_ID`: Google Tag Manager container ID

## CI/CD Pipeline

### PR Previews

Every pull request automatically generates a preview deployment on Vercel. The preview URL will be posted as a comment on the PR.

### Performance Budget

We use Lighthouse CI to enforce performance standards. PRs will be blocked if they don't meet the following criteria:

- Performance score ≥ 90
- Largest Contentful Paint ≤ 1.8s
- Total Blocking Time ≤ 200ms
- Cumulative Layout Shift ≤ 0.1
- First Contentful Paint ≤ 1.5s
- Time to Interactive ≤ 3s

### Analytics

The application uses Google Analytics 4 via Google Tag Manager to track user interactions. The following custom events are implemented:

- `calc_submit`: Fired when a user submits a calculation
- `calc_result`: Fired when a calculation result is displayed
- `calc_error`: Fired when a calculation error occurs
- `pdf_download`: For future use when PDF download functionality is added
- `api_call`: For future use when API integration is added
- `outbound_affiliate`: Fired when a user clicks on an external link

## Deployment

The application is deployed on Vercel with the following branches:

- `main`: Production environment
- `staging`: Staging environment for testing before production
\`\`\`

Finally, let's update the package.json to include scripts for Lighthouse CI:

```typescriptreact file="package.json"
[v0-no-op-code-block-prefix]{
  "name": "qbcc-calculator",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "lighthouse": "lighthouse http://localhost:3000 --output-path=./lighthouse-report.html --view"
  },
  "dependencies": {
    "@radix-ui/react-accordion": "^1.1.2",
    "@radix-ui/react-alert-dialog": "^1.0.5",
    "@radix-ui/react-aspect-ratio": "^1.0.3",
    "@radix-ui/react-avatar": "^1.0.4",
    "@radix-ui/react-checkbox": "^1.0.4",
    "@radix-ui/react-collapsible": "^1.0.3",
    "@radix-ui/react-context-menu": "^2.1.5",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-hover-card": "^1.0.7",
    "@radix-ui/react-label": "^2.0.2",
    "@radix-ui/react-menubar": "^1.0.4",
    "@radix-ui/react-navigation-menu": "^1.1.4",
    "@radix-ui/react-popover": "^1.0.7",
    "@radix-ui/react-progress": "^1.0.3",
    "@radix-ui/react-radio-group": "^1.1.3",
    "@radix-ui/react-scroll-area": "^1.0.5",
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-separator": "^1.0.3",
    "@radix-ui/react-slider": "^1.1.2",
    "@radix-ui/react-slot": "^1.0.2",
    "@radix-ui/react-switch": "^1.0.3",
    "@radix-ui/react-tabs": "^1.0.4",
    "@radix-ui/react-toast": "^1.1.5",
    "@radix-ui/react-toggle": "^1.0.3",
    "@radix-ui/react-toggle-group": "^1.0.4",
    "@radix-ui/react-tooltip": "^1.0.7",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "lucide-react": "^0.323.0",
    "next": "14.1.0",
    "next-themes": "^0.2.1",
    "react": "^18",
    "react-dom": "^18",
    "tailwind-merge": "^2.2.1",
    "tailwindcss-animate": "^1.0.7"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "autoprefixer": "^10.0.1",
    "eslint": "^8",
    "eslint-config-next": "14.1.0",
    "postcss": "^8",
    "tailwindcss": "^3.3.0",
    "typescript": "^5"
  }
}
