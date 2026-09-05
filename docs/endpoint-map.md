# MY-CASHIER Endpoint Map

Base URL web production: `https://my-kasirku-2303node.vercel.app/api/v1`.

All business endpoints use cookie authentication via `my_cashier_session`. Mutating endpoints use `x-csrf-token`, except `POST /auth/login`, which is intentionally exempt so a first login can start cleanly.

| Method | Endpoint | Authentication | CSRF | Request body | Response body | Frontend usage |
| --- | --- | --- | --- | --- | --- | --- |
| GET | `/` | Public | No | None | API name, version, health URL | Manual production check |
| GET | `/api/v1/health` | Public | No | None | `{ status: "ok" }` | Manual/API health check |
| GET | `/auth/csrf` | Public | No | None | `{ csrfToken }` | `web/lib/api-client.ts` before mutations |
| POST | `/auth/login` | Public | No | `{ email, password }` | Authenticated user | `web/features/auth/login-form.tsx` |
| POST | `/auth/logout` | Required | Yes | None | `null` | `web/app/home-client.tsx` |
| GET | `/auth/me` | Required | No | None | Authenticated profile and role | `web/app/home-client.tsx` |
| GET | `/reports/dashboard` | Required, `reports.view` | No | Query params optional | Dashboard metrics, chart, recent sales, low stock | `web/features/dashboard/dashboard-view.tsx` |
| GET | `/products` | Required | No | `limit`, `search`, `categoryId` query params | Product list | POS and product table |
| GET | `/products/categories` | Required | No | None | Category list | POS category filters |
| POST | `/products` | Required, `products.manage` | Yes | Product payload | Product | Management actions |
| PATCH | `/products/:id` | Required, `products.manage` | Yes | Product patch payload | Product | Management actions |
| DELETE | `/products/:id` | Required, `products.manage` | Yes | None | Archived product | Management actions |
| GET | `/inventory` | Required | No | Query params optional | Inventory rows | Inventory table |
| POST | `/inventory/adjustments` | Required, `inventory.adjust` | Yes | Adjustment payload | Adjustment result | Management actions |
| GET | `/customers` | Required | No | Query params optional | Customer list | POS customer select and customer table |
| POST | `/customers` | Required, `customers.manage` | Yes | Customer payload | Customer | Management actions |
| GET | `/sales` | Required | No | Query params optional | Sale list | Sales table |
| POST | `/sales` | Required, `sales.create` | Yes | Checkout payload with idempotency key | Sale | POS checkout |
| GET | `/sales/:id` | Required | No | None | Sale detail | Detail workflows |
| GET | `/sales/:id/invoice.pdf` | Required | No | None | PDF invoice | POS success modal |
| POST | `/sales/:id/email-invoice` | Required, `invoice.send` | Yes | Email payload optional | Email job result | Invoice workflows |
| POST | `/sales/:id/resend-invoice` | Required, `invoice.send` | Yes | Email payload optional | Email job result | Invoice workflows |
| GET | `/sales/:id/email-status` | Required | No | None | Email status | Invoice workflows |
| GET | `/shifts/current` | Required | No | None | Current shift or `null` | POS shift state |
| POST | `/shifts/open` | Required, `shift.manage` | Yes | Opening cash payload | Shift | POS opening flow |
| POST | `/shifts/:id/close` | Required, `shift.manage` | Yes | Closing payload | Shift | Shift close flow |
| GET | `/branches` | Required | No | None | Branch list | Branch workflows |
| POST | `/uploads/products/:productId/images` | Required, `products.manage` | Yes | Multipart `images[]` | Uploaded image metadata | Product image upload |
