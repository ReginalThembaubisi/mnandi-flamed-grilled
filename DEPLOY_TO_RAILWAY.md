# Deploying Mnandi to Railway

This guide covers how to deploy the Spring Boot backend and Next.js frontend to Railway.

## Prerequisites
- A [GitHub](https://github.com/) account.
- A [Railway](https://railway.app/) account.
- The project pushed to a GitHub repository.

## 1. Create a Project on Railway
1.  Log in to Railway.
2.  Click **New Project**.
3.  Select **Deploy from GitHub repo**.
4.  Choose your repository (`mnandi-flamed-grilled`).

## 2. Configure Backend Service (Spring Boot)
Railway will detect the code. We need to tell it how to build and run the Java backend.

1.  Click on the new service card.
2.  Go to **Settings**.
3.  Scroll to **Build**.
    - **Builder**: Select `Dockerfile`.
    - **Root Directory**: Leave as `/` (since `Dockerfile` is in the root).
4.  Go to **Variables**.
    - Add the following variables:
        - `PORT`: `8080`
        - `SPRING_DATASOURCE_USERNAME`: `postgres` (or as provided by Railway DB)
        - `SPRING_DATASOURCE_PASSWORD`: (as provided by Railway DB)
        - `JDBC_DATABASE_URL`: (the JDBC URL for Postgres, e.g., `jdbc:postgresql://host:port/db`)
        - `MNANDI_ADMIN_INITIAL_PASSWORD`: (Optional) Initial password for the admin user. Defaults to `mnandi2024` if not set.

### Adding a Database
1.  In the project canvas, right-click (or click **New**) -> **Database** -> **Add PostgreSQL**.
2.  Connect the PostgreSQL service to your Backend service to automatically inject variables (Railway often does this via `DATABASE_URL`).
    - *Note: Spring Boot needs `JDBC_DATABASE_URL`. You might need to copy the `DATABASE_URL` value and prefix it with `jdbc:` and ensure it starts with `postgresql://`.*

## 3. Configure Frontend Service (Next.js)
Since the frontend is in the same repo, we need to deploy it as a separate service rooted in the same repo.

1.  In the project canvas, click **New** -> **GitHub Repo**.
2.  Select the **same repository again**.
3.  Open the new service's **Settings**.
4.  **Service Name**: Rename it to "Frontend".
5.  **Build**:
    - **Builder**: Select `Nixpacks` (default) or `Dockerfile` (if you created one, but Nixpacks works well for Next.js).
    - **Build Command**: `npm run build`
    - **Start Command**: `npm start`
6.  **Variables**:
    - `BACKEND_URL`: The internal Railway URL of your backend service (e.g., `http://backend-service.railway.internal:8080` or the public domain `https://mnandi-backend.up.railway.app`).
    - `NEXT_PUBLIC_ADMIN_USERNAME`: Admin username for the dashboard login.
    - `NEXT_PUBLIC_ADMIN_PASSWORD`: Admin password for the dashboard login.

## 4. Final Steps
1.  **Generate Domain**: Go to **Settings** -> **Networking** for the Frontend service and click **Generate Domain**.
2.  Visit the domain to see your app live!

## Troubleshooting
- **Build Fails**: Check logs. Ensure the right Java version is used (Dockerfile specifies JDK 21).
- **Database Connection**: Verify `JDBC_DATABASE_URL` format.
