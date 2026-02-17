# Security Configuration

## Admin Credentials

This application uses environment variables to manage the initial admin credentials. **Do not commit these files to version control.**

### Frontend (Next.js)

1.  Create a file named `.env.local` in the project root.
2.  Add the following variables:

```env
NEXT_PUBLIC_ADMIN_USERNAME=your_secure_username
NEXT_PUBLIC_ADMIN_PASSWORD=your_secure_password
```

### Backend (Spring Boot)

The backend initializes the admin user ONLY if no users exist in the database.

1.  To set the initial password for the admin user, set the environment variable `MNANDI_ADMIN_INITIAL_PASSWORD` before starting the server.
2.  Example:
    ```bash
    export MNANDI_ADMIN_INITIAL_PASSWORD=mySuperSecretPassword
    ./start-backend.sh
    ```
    Or in IntelliJ/Eclipse run configurations.

3.  If you are running everything locally, you can add it to your `.env.local` if you use a script to load it, but Spring Boot reads from system environment variables by default.

### Changing Credentials

- **Frontend**: Update `.env.local` and restart the Next.js server.
- **Backend**: The environment variable is only used for *initial* creation. To change the password for an existing admin, you must use the application's change password feature or update the database directly.
