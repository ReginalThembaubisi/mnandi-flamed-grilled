# Deploying Mnandi to Vercel (Frontend Only)

Vercel is optimized for Next.js and is the best place to host your frontend. However, it **does not support Java applications**.

**Strategy**: Hybrid Deployment
1.  **Backend**: Deploy the Spring Boot API to **Railway** (as described in `DEPLOY_TO_RAILWAY.md`).
2.  **Frontend**: Deploy the Next.js app to **Vercel**.

## Prerequisites
- A [Vercel](https://vercel.com/) account.
- The project pushed to GitHub.
- A running backend on Railway (or similar).

## Steps

1.  **Log in to Vercel** and click **"Add New..."** -> **"Project"**.
2.  **Import Git Repository**: Select your `mnandi-flamed-grilled` repository.
3.  **Configure Project**:
    - **Framework Preset**: Next.js (should be auto-detected).
    - **Root Directory**: `./` (default).
    - **Build Command**: `npm run build` (default).
4.  **Environment Variables**:
    You MUST add the following variables in the "Environment Variables" section:

    | Variable | Value | Description |
    | :--- | :--- | :--- |
    | `NEXT_PUBLIC_API_URL` | `https://your-backend.up.railway.app/api` | The URL of your live backend (e.g., on Railway) |
    | `NEXT_PUBLIC_ADMIN_USERNAME` | `admin` (or your choice) | Username for admin dashboard. |
    | `NEXT_PUBLIC_ADMIN_PASSWORD` | `your_secure_password` | Password for admin dashboard. |

5.  **Deploy**: Click **Deploy**.

## Connecting Frontend to Backend
- Vercel will build your site and give you a URL (e.g., `https://mnandi.vercel.app`).
- Your frontend will now talk to your backend on Railway.
- Ensure your Backend's **CORS Configuration** allows requests from your Vercel domain.

    *Note: In `CorsConfig.java`, we allow all origins (`/**`) by default, so it should work immediately.*
