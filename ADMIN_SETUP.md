# Admin User Setup Instructions

To set up the admin user with email `subhisuper@gmail.com`:

## Option 1: Firebase Console (Recommended)

1. Go to Firebase Console > Authentication
2. Click "Add user"
3. Enter email: `subhisuper@gmail.com`
4. Set a password
5. Copy the User UID that is generated
6. Go to Firestore Database
7. Navigate to the `users` collection
8. Create a new document with the User UID as the document ID
9. Add the following fields:
   - `email`: `subhisuper@gmail.com`
   - `role`: `fair_director` (or `website_manager` if you prefer)
   - `createdAt`: (current timestamp)
   - `profileComplete`: `true`
   - `emailVerified`: `true`

## Option 2: Using Firebase CLI

```bash
# First, create the user in Auth
firebase auth:import users.json

# Then create the user document in Firestore
# You can use the Firebase Console or write a Cloud Function
```

## Admin Roles

- `fair_director`: Full admin access
- `website_manager`: Full admin access

Both roles have the same permissions and can:
- View and approve SRAs
- View and approve Judges
- Receive email notifications when new SRAs or Judges register

## Email Notifications

Admins will automatically receive email notifications when:
- A new SRA registers
- A new Judge registers

These notifications are sent via Cloud Functions to all users with `fair_director` or `website_manager` roles.
