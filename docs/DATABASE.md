# Database — Udyog

MongoDB with Mongoose. All collections are namespaced by `businessId` for multi-tenancy.

---

## Collections

### `users`
```
_id                   ObjectId
businessId            ref: Business (required)
name                  String (required)
email                 String (required, unique, lowercase)
passwordHash          String (select: false)
role                  Enum: ADMIN | STAFF (default: ADMIN)
isEmailVerified       Boolean (default: false)
isActive              Boolean (default: true)
onboardingCompleted   Boolean (default: false)
emailOTP              String (select: false)
emailOTPExpiry        Date (select: false)
passwordResetToken    String (select: false)
passwordResetExpiry   Date (select: false)
failedLoginAttempts   Number (default: 0, select: false)
lockedUntil           Date (select: false)
lastLoginAt           Date
createdAt, updatedAt  (timestamps)
```

### `businesses`
```
_id                   ObjectId
name                  String (required)
phone                 String
address               String
upiId                 String (UPI VPA e.g. "9876543210@ybl")
isActive              Boolean (default: true)
onboarding: {
  profileCompleted    Boolean (default: false)
}
createdAt, updatedAt  (timestamps)
```

### `orders`
```
_id                   ObjectId
businessId            ref: Business (required, indexed)
clientId              ref: Client
clientSnapshot: {     (denormalized — preserved even if client edited)
  name                String
  phone               String
  address             String
}
items: [{
  productId           ref: Product
  productName         String (snapshot)
  quantity            Number
  unit                String
  unitPrice           Number
  amount              Number
}]
orderDate             Date
deliveryDate          Date (indexed)
status                Enum: CREATED | PENDING | DELIVERED | CANCELLED (indexed)
financial: {
  subtotal            Number
  discountAmount      Number (default: 0)
  taxRate             Number (default: 0)
  taxAmount           Number (default: 0)
  total               Number
}
payment: {
  advancePaid         Number (default: 0)
  totalPaid           Number (default: 0)
  remainingAmount     Number
  status              Enum: UNPAID | PARTIAL | PAID
  transactions: [{
    amount            Number
    method            Enum: Cash | UPI | Bank Transfer | Cheque
    note              String
    recordedAt        Date
  }]
}
notes                 String
isDeleted             Boolean (default: false, indexed)
createdAt, updatedAt  (timestamps)
```

**Indexes:**
- `{ businessId: 1, status: 1 }`
- `{ businessId: 1, deliveryDate: 1 }`
- `{ businessId: 1, isDeleted: 1 }`
- `{ businessId: 1, "clientSnapshot.name": 1 }` (for search)

### `clients`
```
_id                   ObjectId
businessId            ref: Business (required, indexed)
name                  String (required)
phone                 String
address               String
isActive              Boolean (default: true)
createdAt, updatedAt  (timestamps)
```

### `products`
```
_id                   ObjectId
businessId            ref: Business (required, indexed)
name                  String (required)
price                 Number (required)
unit                  String (required — kg, piece, dozen, etc.)
isActive              Boolean (default: true)
createdAt, updatedAt  (timestamps)
```

### `notifications`
```
_id                   ObjectId
businessId            ref: Business (required, indexed)
type                  String (e.g. "DELIVERY_REMINDER")
title                 String
message               String
orderId               ref: Order
isRead                Boolean (default: false)
createdAt, updatedAt  (timestamps)
```

---

## Key Design Decisions

### Denormalized clientSnapshot on Orders
When an order is created, client details are copied into `clientSnapshot`.
This means if the client's phone number changes later, old orders still show the original phone — which is correct for historical records and WhatsApp messages.

### Denormalized productName on Order Items
Same principle — if a product is renamed, old orders still show the original name.

### Soft Delete on Orders
Orders are never hard deleted. `isDeleted: true` hides them from all queries.
This preserves financial history and audit trail.

### Payment Transactions Array
Payments are stored as an array inside the order document (not a separate collection).
This keeps all order financial data in one document — simpler queries, atomic updates.
Acceptable because the number of transactions per order is small (typically 1-3).

### Multi-tenancy via businessId
Every query includes `businessId: req.user.businessId` in the filter.
This is enforced at the controller level — not the model level — for flexibility.
When adding new controllers, ALWAYS include businessId filter.