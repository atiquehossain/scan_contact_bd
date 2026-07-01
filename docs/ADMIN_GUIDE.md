# NoNumQR Admin Guide

Admins can manage users, QR tags, orders, payments, products, reseller applications, societies, abuse reports, CMS pages, settings, emergency numbers, cities/districts, audit logs, health, and backup status.

Local admin login is created from `apps/api/.env`:

- URL: `/admin`
- Email: `ADMIN_EMAIL`
- Password: `ADMIN_PASSWORD`

Use a strong unique password and rotate it after the first deployment.

The seed command creates only roles and the super admin account. It does not create demo users, QR tags, products, cities, CMS pages, orders, chats, or other static business data.

## Owner QR Flow

1. Open `/admin` and log in.
2. Use **Create New Tag**.
3. Enter the owner's phone number and owner name. Both are required for admin-created QR tags.
4. Create the tag and print/share the generated QR.
5. The owner logs in or signs up in the separate Flutter owner app with the same phone number.
6. If a scanner submits a message, the owner replies from the owner app.

## Owner Message Review

- The admin page shows owners as a list of owner name and phone number.
- The owner list does not show chat bodies directly.
- Click an owner to inspect QR tags, COD orders, and submitted text messages.
- Admin review is read-only. Admin cannot reply as the owner.

## User Deletion

- Super admin can delete users from the admin **Users** section.
- Deleting a user removes their account, owned QR tags, contact requests, notifications, sessions, and matching COD orders.
- The currently logged-in super admin account cannot delete itself from the UI.
