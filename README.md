# Secure Journal

A modern, secure journal application built with React, TypeScript, and Passage authentication. Create, edit, and manage your personal journal entries with passwordless authentication using passkeys.

![Secure Journal](https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=400&fit=crop&q=80)

## Features

- 🔐 **Passwordless Authentication** - Sign in with passkeys, biometrics, or hardware security keys
- 📝 **Rich Text Editor** - Write entries with Markdown support and live preview
- 🤖 **AI Summarization** - Generate AI-powered summaries of your entries
- 🔍 **Search & Filter** - Find entries quickly with client-side search
- 📱 **Responsive Design** - Works perfectly on desktop and mobile
- 🌙 **Dark Mode** - Automatic dark/light theme support
- 🔒 **Secure by Design** - No passwords, no secrets stored in frontend

## Technology Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, shadcn/ui components
- **Authentication**: Passage by 1Password (WebAuthn/Passkeys)
- **Routing**: React Router v6
- **State Management**: React hooks and context
- **Build Tool**: Vite with SWC

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Passage account (free at [console.passage.id](https://console.passage.id/))

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd secure-journal
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

4. **Configure Passage Authentication**
   - Sign up at [console.passage.id](https://console.passage.id/)
   - Create a new app
   - Copy your App ID to `.env`:
     ```
     VITE_PASSAGE_APP_ID=your_passage_app_id_here
     ```

5. **Configure Backend API**
   - Set your backend API URL in `.env`:
     ```
     VITE_API_BASE_URL=http://localhost:3000
     ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:8080`.

## Environment Variables

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `VITE_PASSAGE_APP_ID` | Your Passage application ID | Yes | `app_ABC123...` |
| `VITE_API_BASE_URL` | Backend API base URL | Yes | `https://api.yourapp.com` |

## API Integration

The frontend expects these backend endpoints:

### Entries
- `GET /entries` - List all entries for authenticated user
- `POST /entries` - Create new entry
- `GET /entries/:id` - Get specific entry
- `PUT /entries/:id` - Update entry
- `DELETE /entries/:id` - Delete entry

### AI Features
- `POST /entries/:id/summarize` - Generate AI summary

### Authentication
All API requests include `Authorization: Bearer <jwt_token>` where the JWT is fetched fresh from Passage for each request.

## Security Model

### Frontend Security
- **No secrets stored**: All sensitive data lives in the backend
- **Fresh JWT tokens**: Authentication tokens are fetched per-request, not stored
- **Passkey authentication**: Uses WebAuthn for passwordless, phishing-resistant auth
- **Secure defaults**: All API calls use secure headers and HTTPS in production

### Authentication Flow
1. User visits app and is redirected to `/login`
2. Passage handles passkey authentication
3. On success, user is redirected to `/app`
4. Each API call fetches a fresh JWT from Passage
5. JWT is sent to backend for authorization

## Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect repository to Vercel
3. Set environment variables in Vercel dashboard:
   - `VITE_PASSAGE_APP_ID`
   - `VITE_API_BASE_URL`
4. Deploy

### Other Platforms
Build the project and serve the `dist` folder:
```bash
npm run build
```

## Development

### Project Structure
```
src/
├── components/          # Reusable UI components
├── lib/                # Utilities and API clients
├── pages/              # Route components
├── hooks/              # Custom React hooks
└── index.css           # Global styles and design system
```

### Key Components
- `AuthProvider` - Manages Passage authentication state
- `withAuth` - HOC for protecting routes
- `JournalAPI` - Type-safe API client
- `Editor` - Markdown editor with preview
- `Header` - Navigation and user menu

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Keyboard Shortcuts

- `Cmd/Ctrl + S` - Save current entry
- `Cmd/Ctrl + Enter` - Generate AI summary (on entry detail page)

## Browser Support

- Chrome/Edge 85+
- Firefox 85+
- Safari 14+

Passkey support varies by browser and platform. See [Passage documentation](https://docs.passage.id/) for detailed compatibility.

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- [Passage Documentation](https://docs.passage.id/)
- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

---

Built with ❤️ using modern web technologies and secure authentication.