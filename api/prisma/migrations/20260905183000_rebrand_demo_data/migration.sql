UPDATE "Tenant"
SET "name" = 'MY-CASHIER Mart Demo',
    "slug" = 'my-cashier-mart-demo'
WHERE "slug" = 'nex' || 'xus-mart-demo';

UPDATE "Store"
SET "name" = 'MY-CASHIER Mart',
    "email" = 'halo@my-cashier.test'
WHERE "name" = 'Nex' || 'xus Mart'
   OR "email" = 'halo@' || 'nex' || 'xuspos.test';

UPDATE "User"
SET "name" = 'Owner MY-CASHIER',
    "email" = 'owner@my-cashier.test'
WHERE "email" = 'owner@' || 'nex' || 'xuspos.test';

UPDATE "User"
SET "email" = 'admin@my-cashier.test'
WHERE "email" = 'admin@' || 'nex' || 'xuspos.test';

UPDATE "User"
SET "email" = 'manager@my-cashier.test'
WHERE "email" = 'manager@' || 'nex' || 'xuspos.test';

UPDATE "User"
SET "email" = 'cashier@my-cashier.test'
WHERE "email" = 'cashier@' || 'nex' || 'xuspos.test';

UPDATE "Supplier"
SET "id" = 'demo-supplier-my-cashier'
WHERE "id" = 'demo-supplier-' || 'nex' || 'xus';
