I'll provide you with **complete ER diagrams** in **ASCII/text format** that you can read directly in chat. These are detailed, production-grade database schemas for your Flipkart Clone.

---

## 📊 **COMPLETE ER DIAGRAM - FLIPKART CLONE**

### **1. MAIN ER DIAGRAM (All Tables)**

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                           FLIPKART CLONE - DATABASE ER DIAGRAM                                        │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘

    ┌──────────────┐                    ┌──────────────┐                    ┌──────────────┐
    │    USERS     │                    │   PRODUCTS   │                    │  CATEGORIES  │
    │──────────────│                    │──────────────│                    │──────────────│
    │ PK │ _id     │                    │ PK │ _id     │                    │ PK │ _id     │
    │    │ name    │                    │    │ name    │                    │    │ name    │
    │    │ email   │                    │    │ slug    │                    │    │ slug    │
    │    │ password│                    │    │ price   │                    │    │ parentId │──┐
    │    │ role    │                    │    │ desc    │                    │    │ image    │  │
    │    │ phone   │                    │    │ category│────────────────────┼────│ desc     │  │
    │    │ avatar  │                    │    │ brand   │                    │    │ isActive │  │
    │    │ isActive│                    │    │ stock   │                    └──────────────┘  │
    │    │ lastLogin│                   │    │ images  │                                      │
    │    │ refresh │                    │    │ rating  │                    ┌──────────────┐  │
    │    │ createdAt│                   │    │ numReviews                   │   INVENTORY  │  │
    │    │ updatedAt│                   │    │ isActive│                    │──────────────│  │
    └──────┬───────┘                    │    │ createdAt│                    │ PK │ _id     │  │
           │                            │    │ updatedAt│                    │ FK │ productId│◄─┘
           │                            └──────┬───────┘                    │    │ warehouse │
           │                                   │                            │    │ quantity │
           │                                   │                            │    │ reserved │
           │                                   │                            │    │ location │
           │                                   │                            │    │ lastRestocked│
           │                                   │                            └──────────────┘
           │                                   │
    ┌──────┴───────┐                    ┌──────┴───────┐
    │    CART      │                    │   REVIEWS   │
    │──────────────│                    │──────────────│
    │ PK │ _id     │                    │ PK │ _id     │
    │ FK │ userId  │◄───────────────────│ FK │ userId  │
    │    │ items[] │                    │ FK │ productId│
    │    │ total   │                    │    │ rating  │
    │    │ expires │                    │    │ title   │
    └──────────────┘                    │    │ comment │
                                        │    │ images  │
    ┌──────────────┐                    │    │ helpful[]│
    │  WISHLIST    │                    │    │ isVerified│
    │──────────────│                    │    │ createdAt│
    │ PK │ _id     │                    │    │ updatedAt│
    │ FK │ userId  │                    └──────────────┘
    │    │ products[]───────────────────┐
    │    │ createdAt│                   │
    └──────────────┘                   │
                                       │
    ┌──────────────┐                   │
    │   ADDRESS    │                   │
    │──────────────│                   │
    │ PK │ _id     │                   │
    │ FK │ userId  │                   │
    │    │ name    │                   │
    │    │ phone   │                   │
    │    │ street  │                   │
    │    │ city    │                   │
    │    │ state   │                   │
    │    │ pincode │                   │
    │    │ country │                   │
    │    │ isDefault│                  │
    │    │ type    │                   │
    └──────────────┘                   │
                                       │
    ┌──────────────┐                   │
    │   SESSIONS   │                   │
    │──────────────│                   │
    │ PK │ _id     │                   │
    │ FK │ userId  │                   │
    │    │ token   │                   │
    │    │ deviceInfo──────────────────┼──┐
    │    │ ipAddress│                  │  │
    │    │ expiresAt│                  │  │
    └──────────────┘                  │  │
                                      │  │
    ┌──────────────┐                  │  │
    │    ORDERS    │◄─────────────────┼──┘
    │──────────────│                  │
    │ PK │ _id     │                  │
    │    │ orderId │                  │
    │ FK │ userId  │──────────────────┘
    │    │ items[] │
    │    │ subtotal│
    │    │ tax     │
    │    │ shipping│
    │    │ discount│
    │    │ total   │
    │    │ status  │
    │    │ paymentStatus│
    │    │ paymentMethod│
    │    │ shippingAddr│
    │    │ trackingId│
    │    │ deliveredAt│
    │    │ cancelledAt│
    │    │ createdAt│
    │    │ updatedAt│
    └──────┬───────┘
           │
           │
    ┌──────┴───────┐                    ┌──────────────┐
    │   PAYMENTS   │                    │   COUPONS    │
    │──────────────│                    │──────────────│
    │ PK │ _id     │                    │ PK │ _id     │
    │ FK │ orderId │◄───────────────────│    │ code    │
    │ FK │ userId  │                    │    │ desc    │
    │    │ amount  │                    │    │ discountType│
    │    │ method  │                    │    │ discountValue│
    │    │ transId │                    │    │ minOrder │
    │    │ rzpOrderId│                  │    │ maxDiscount│
    │    │ rzpPaymentId│                │    │ usageLimit│
    │    │ status  │                    │    │ usedCount│
    │    │ failureReason│               │    │ validFrom│
    │    │ metadata│                    │    │ validUntil│
    │    │ createdAt│                   │    │ isActive│
    └──────────────┘                    └──────────────┘


┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                              RELATIONSHIPS LEGEND                                                     │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│  PK = Primary Key     FK = Foreign Key     ◄────► = One-to-Many     ◄───── = One-to-One     ◄─┐ = Self Reference    │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### **2. DETAILED USER MODULE ER DIAGRAM**

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    USER MODULE - Complete Schema                                              │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────┘

                                        ┌─────────────────────────────────────┐
                                        │              USERS                   │
                                        │─────────────────────────────────────│
                                        │  _id (ObjectId)         [PK]        │
                                        │  name (String)          [Required]  │
                                        │  email (String)         [UK]        │
                                        │  password (String)      [Required]  │
                                        │  role (Enum)            [user/admin/vendor]│
                                        │  phone (String)         [10 digits] │
                                        │  avatar (String)        [URL]       │
                                        │  isActive (Boolean)     [default: true]│
                                        │  lastLogin (Date)                    │
                                        │  refreshToken (String)               │
                                        │  createdAt (Date)                    │
                                        │  updatedAt (Date)                    │
                                        └───────────────┬─────────────────────┘
                                                          │
                          ┌───────────────────────────────┼───────────────────────────────┐
                          │                               │                               │
                          │ 1                           1 │ n                           1 │ n
                          ▼                               ▼                               ▼
        ┌─────────────────────────────────┐ ┌─────────────────────────────────┐ ┌─────────────────────────────────┐
        │            ADDRESS              │ │              CART               │ │           WISHLIST             │
        │─────────────────────────────────│ │─────────────────────────────────│ │─────────────────────────────────│
        │  _id (ObjectId)       [PK]      │ │  _id (ObjectId)       [PK]      │ │  _id (ObjectId)       [PK]      │
        │  user_id (ObjectId)   [FK]──────┘ │  user_id (ObjectId)   [FK]──────┘ │  user_id (ObjectId)   [FK]──────┘
        │  name (String)                   │  items (Array)                    │  products (Array)                │
        │  phone (String)                  │  totalAmount (Number)             │  createdAt (Date)                │
        │  street (String)                 │  expiresAt (Date)    [TTL]        │                                   │
        │  city (String)                   │                                   │                                   │
        │  state (String)                  │                                   │                                   │
        │  pincode (String)                │                                   │                                   │
        │  country (String)                │                                   │                                   │
        │  isDefault (Boolean)             │                                   │                                   │
        │  type (Enum)        [home/work/other]                              │                                   │
        └─────────────────────────────────┘ └─────────────────────────────────┘ └─────────────────────────────────┘
                          │
                          │ 1
                          ▼
        ┌─────────────────────────────────┐
        │            ORDERS               │
        │─────────────────────────────────│
        │  user_id (ObjectId)   [FK]      │
        │  ... (other fields)             │
        └─────────────────────────────────┘

        ┌─────────────────────────────────┐
        │           SESSIONS              │
        │─────────────────────────────────│
        │  _id (ObjectId)       [PK]      │
        │  user_id (ObjectId)   [FK]──────┘
        │  token (String)       [UK]      │
        │  deviceInfo (String)            │
        │  ipAddress (String)             │
        │  expiresAt (Date)     [TTL]     │
        └─────────────────────────────────┘

INDEXES:
  - users: email (unique), createdAt (descending)
  - address: user_id + isDefault (compound)
  - sessions: token (unique), expiresAt (TTL)
```

---

### **3. DETAILED PRODUCT MODULE ER DIAGRAM**

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   PRODUCT MODULE - Complete Schema                                           │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────┘

        ┌─────────────────────────────────┐          ┌─────────────────────────────────┐
        │           CATEGORIES            │          │            BRANDS              │
        │─────────────────────────────────│          │─────────────────────────────────│
        │  _id (ObjectId)       [PK]      │          │  _id (ObjectId)       [PK]      │
        │  name (String)        [UK]      │          │  name (String)        [UK]      │
        │  slug (String)        [UK]      │          │  logo (String)                  │
        │  parent_id (ObjectId) [FK]──────┼──────┐   │  description (String)           │
        │  image (String)                  │      │   │  website (String)                │
        │  description (String)            │      │   │  isActive (Boolean)             │
        │  isActive (Boolean)              │      │   └─────────────────────────────────┘
        │  createdAt (Date)                │      │                    │
        │  updatedAt (Date)                │      │                    │
        └───────────────┬─────────────────┘      │                    │
                        │                        │                    │
                        │ 1 (Self reference)     │                    │
                        │                        │                    │
                        └────────────────────────┘                    │
                                                                       │
                                    ┌─────────────────────────────────┼─────────────────────────────────┐
                                    │                                 │                                 │
                                    │ 1                              n │ 1                              n │
                                    ▼                                 ▼                                 ▼
        ┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
        │                                              PRODUCTS                                            │
        │─────────────────────────────────────────────────────────────────────────────────────────────────│
        │  _id (ObjectId)                     [PK]                                                       │
        │  name (String)                      [Required, Indexed]                                        │
        │  slug (String)                      [UK, Required]                                             │
        │  description (String)               [Text Index]                                               │
        │  price (Number)                     [Required, Min 0]                                         │
        │  category_id (ObjectId)             [FK → Categories]                                          │
        │  brand_id (ObjectId)                [FK → Brands]                                              │
        │  stock (Number)                     [Required, Min 0, Indexed]                                 │
        │  images (Array)                     [URLs]                                                     │
        │  rating (Number)                    [0-5, Default 0]                                           │
        │  numReviews (Number)                [Default 0]                                                │
        │  specifications (Object)            [JSON]                                                     │
        │  isActive (Boolean)                 [Default true, Indexed]                                    │
        │  createdAt (Date)                   [Indexed]                                                  │
        │  updatedAt (Date)                                                                              │
        └───────────────────────┬─────────────────────────────────────────────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┬───────────────────────┬───────────────────────┐
        │                       │                       │                       │                       │
        │ 1                     │ 1                     │ n                     │ n                     │ n
        ▼                       ▼                       ▼                       ▼                       ▼
┌───────────────┐       ┌───────────────┐       ┌───────────────┐       ┌───────────────┐       ┌───────────────┐
│   INVENTORY   │       │    REVIEWS    │       │   ORDER_ITEM  │       │  WISHLIST_ITEM│       │   CART_ITEM   │
│───────────────│       │───────────────│       │───────────────│       │───────────────│       │───────────────│
│ _id [PK]      │       │ _id [PK]      │       │ _id [PK]      │       │ _id [PK]      │       │ _id [PK]      │
│ product_id[FK]│       │ product_id[FK]│       │ product_id[FK]│       │ product_id[FK]│       │ product_id[FK]│
│ warehouse     │       │ user_id [FK]  │       │ name (String) │       │ user_id [FK]  │       │ quantity      │
│ quantity      │       │ rating        │       │ price (Number)│       │ addedAt       │       │ price         │
│ reserved      │       │ title         │       │ quantity      │       └───────────────┘       │ total         │
│ location      │       │ comment       │       │ total         │                               │ addedAt       │
│ lastRestocked │       │ images[]      │       └───────────────┘                               └───────────────┘
└───────────────┘       │ helpful[]     │
                        │ isVerified    │
                        │ createdAt     │
                        └───────────────┘

INDEXES (Products):
  - name: text index (search)
  - description: text index (search)
  - category_id + price (compound)
  - brand_id + rating (compound)
  - stock + isActive (for availability)
  - createdAt (descending) for new arrivals
```

---

### **4. DETAILED ORDER MODULE ER DIAGRAM**

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    ORDER MODULE - Complete Schema                                            │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────┘

                                    ┌─────────────────────────────────────────────────────┐
                                    │                      USERS                          │
                                    │─────────────────────────────────────────────────────│
                                    │  _id (ObjectId)                         [PK]        │
                                    └───────────────────────────────┬─────────────────────┘
                                                                    │
                                                                    │ 1
                                                                    │
                                                                    ▼
        ┌───────────────────────────────────────────────────────────────────────────────────────────────────────┐
        │                                                  ORDERS                                                 │
        │───────────────────────────────────────────────────────────────────────────────────────────────────────│
        │  _id (ObjectId)                                           [PK]                                        │
        │  orderId (String)                                        [UK, Required]                               │
        │  user_id (ObjectId)                                      [FK → Users, Required, Indexed]              │
        │  items (Array)                                           [Required]                                   │
        │    └── product_id (ObjectId)                             [FK → Products]                              │
        │    └── name (String)                                     [Denormalized]                               │
        │    └── price (Number)                                    [Denormalized]                               │
        │    └── quantity (Number)                                 [Min 1]                                      │
        │    └── total (Number)                                    [price * quantity]                           │
        │  subtotal (Number)                                       [Required]                                   │
        │  tax (Number)                                            [18% GST]                                    │
        │  shipping (Number)                                       [Free or calculated]                         │
        │  discount (Number)                                       [Coupon applied]                             │
        │  totalAmount (Number)                                    [Required]                                   │
        │  status (Enum)                                           [pending/confirmed/processing/shipped/      │
        │                                                            delivered/cancelled/returned]               │
        │  paymentStatus (Enum)                                    [pending/paid/failed/refunded]               │
        │  paymentMethod (Enum)                                    [COD/Card/UPI/NetBanking]                    │
        │  shippingAddress (Object)                                [Required]                                   │
        │    └── street, city, state, pincode, country                                                          │
        │  coupon_id (ObjectId)                                    [FK → Coupons]                               │
        │  trackingId (String)                                     [Courier tracking]                           │
        │  deliveredAt (Date)                                                                                   │
        │  cancelledAt (Date)                                                                                   │
        │  notes (String)                                         [Optional]                                   │
        │  createdAt (Date)                                       [Indexed]                                    │
        │  updatedAt (Date)                                                                                    │
        └───────────────────────────────────────┬───────────────────────────────────────────────────────────────┘
                                                │
                                                │ 1
                                                │
                                                ▼
        ┌───────────────────────────────────────────────────────────────────────────────────────────────────────┐
        │                                                PAYMENTS                                                │
        │───────────────────────────────────────────────────────────────────────────────────────────────────────│
        │  _id (ObjectId)                                           [PK]                                        │
        │  order_id (ObjectId)                                      [FK → Orders, Required]                     │
        │  user_id (ObjectId)                                       [FK → Users, Required]                      │
        │  amount (Number)                                          [Required]                                  │
        │  paymentMethod (String)                                   [Required]                                  │
        │  transactionId (String)                                   [UK]                                        │
        │  razorpayOrderId (String)                                 [Gateway reference]                         │
        │  razorpayPaymentId (String)                               [Gateway reference]                         │
        │  status (Enum)                                            [pending/success/failed/refunded]           │
        │  failureReason (String)                                                                               │
        │  metadata (Object)                                        [Gateway response]                          │
        │  createdAt (Date)                                                                                    │
        │  updatedAt (Date)                                                                                    │
        └───────────────────────────────────────────────────────────────────────────────────────────────────────┘

        ┌───────────────────────────────────────────────────────────────────────────────────────────────────────┐
        │                                      ORDER TIMELINE (Virtual)                                          │
        │───────────────────────────────────────────────────────────────────────────────────────────────────────│
        │  status_history (Array)                                   [Embedded]                                  │
        │    └── status (String)                                                                                │
        │    └── timestamp (Date)                                                                               │
        │    └── note (String)                                                                                  │
        │    └── updatedBy (ObjectId)                              [FK → Users]                                │
        └───────────────────────────────────────────────────────────────────────────────────────────────────────┘

INDEXES (Orders):
  - user_id + createdAt (compound, descending)
  - orderId (unique)
  - status + paymentStatus (compound)
  - createdAt (TTL index for soft delete - 90 days)
  - trackingId (for courier lookup)
```

---

### **5. DETAILED PAYMENT MODULE ER DIAGRAM**

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   PAYMENT MODULE - Complete Schema                                           │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────┘

        ┌─────────────────────────────────┐          ┌─────────────────────────────────┐
        │              USERS              │          │             ORDERS              │
        │─────────────────────────────────│          │─────────────────────────────────│
        │  _id (ObjectId)       [PK]      │          │  _id (ObjectId)       [PK]      │
        └───────────────┬─────────────────┘          │  orderId (String)               │
                        │                            │  totalAmount (Number)           │
                        │ 1                          │  status (Enum)                  │
                        │                            └───────────────┬─────────────────┘
                        │                                            │
                        │                                            │ 1
                        │                                            │
                        │ 1                                        1 │
                        │                                            │
                        └────────────────────┬───────────────────────┘
                                             │
                                             │
                                             ▼
                        ┌─────────────────────────────────────────────────────────────────┐
                        │                          PAYMENTS                                │
                        │─────────────────────────────────────────────────────────────────│
                        │  _id (ObjectId)                         [PK]                    │
                        │  order_id (ObjectId)                    [FK → Orders, Required]│
                        │  user_id (ObjectId)                     [FK → Users, Required] │
                        │  amount (Number)                        [Required]              │
                        │  paymentMethod (String)                 [Required]              │
                        │  transactionId (String)                 [UK]                    │
                        │  razorpayOrderId (String)                                        │
                        │  razorpayPaymentId (String)                                      │
                        │  status (Enum)                          [Indexed]               │
                        │  failureReason (String)                                          │
                        │  metadata (Object)                                               │
                        │  refundAmount (Number)                                           │
                        │  refundTransactionId (String)                                    │
                        │  refundReason (String)                                           │
                        │  refundedAt (Date)                                               │
                        │  createdAt (Date)                       [Indexed]               │
                        │  updatedAt (Date)                                                │
                        └─────────────────────────────────────────────────────────────────┘
                                          │
                                          │
                        ┌─────────────────┼─────────────────┐
                        │                 │                 │
                        │                 │                 │
                        ▼                 ▼                 ▼
        ┌───────────────────────┐ ┌───────────────────────┐ ┌───────────────────────┐
        │   SAVED_CARDS (Optional)│ │   WEBHOOK_LOGS        │ │   REFUND_HISTORY      │
        │───────────────────────│ │───────────────────────│ │───────────────────────│
        │  _id [PK]             │ │  _id [PK]             │ │  _id [PK]             │
        │  user_id [FK]         │ │  payment_id [FK]      │ │  payment_id [FK]      │
        │  card_token (Encrypted)│ │  event_type (String)  │ │  amount (Number)      │
        │  card_last4 (String)  │ │  payload (Object)     │ │  reason (String)      │
        │  card_brand (String)  │ │  processed (Boolean)  │ │  status (Enum)        │
        │  isDefault (Boolean)  │ │  processedAt (Date)   │ │  createdAt (Date)     │
        │  createdAt (Date)     │ │  createdAt (Date)     │ │                      │
        └───────────────────────┘ └───────────────────────┘ └───────────────────────┘

PAYMENT FLOW:
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                                              │
│  1. Order Created ──► 2. Payment Initiate ──► 3. Gateway Redirect ──► 4. User Pays                         │
│         │                     │                      │                      │                              │
│         ▼                     ▼                      ▼                      ▼                              │
│   status: pending      create payment      razorpayOrderId      user enters card/UPI                        │
│                                                                                                              │
│                                    ┌─────────────────────────────────────────────────────────────────────┐ │
│                                    │                                                                       │ │
│                                    ▼                                                                       │ │
│  5. Webhook Received ◄────────── 6. Payment Success ──► 7. Verify Signature ──► 8. Order Confirmed        │ │
│         │                     │                      │                      │                              │
│         ▼                     ▼                      ▼                      ▼                              │
│   update status         status: success        signature match        status: confirmed                    │
│                                                                         paymentStatus: paid                 │
│                                                                                                              │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────┘

INDEXES (Payments):
  - order_id (unique)
  - transactionId (unique)
  - status + createdAt (compound)
  - user_id + createdAt (for user history)
```

---

### **6. DETAILED COUPON MODULE ER DIAGRAM**

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    COUPON MODULE - Complete Schema                                           │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────┘

        ┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐
        │                                              COUPONS                                                  │
        │─────────────────────────────────────────────────────────────────────────────────────────────────────│
        │  _id (ObjectId)                                           [PK]                                        │
        │  code (String)                                            [UK, Required, Upper]                      │
        │  description (String)                                                                                │
        │  discountType (Enum)                                      [percentage/fixed]                         │
        │  discountValue (Number)                                   [Required]                                 │
        │  minOrderAmount (Number)                                  [Default 0]                                │
        │  maxDiscount (Number)                                     [For percentage coupons]                   │
        │  usageLimit (Number)                                      [Total times usable]                       │
        │  perUserLimit (Number)                                    [Times per user]                           │
        │  usedCount (Number)                                       [Current usage]                            │
        │  applicableCategories (Array)                             [Optional]                                 │
        │  applicableProducts (Array)                               [Optional]                                 │
        │  excludedCategories (Array)                               [Optional]                                 │
        │  excludedProducts (Array)                                 [Optional]                                 │
        │  validFrom (Date)                                         [Required]                                 │
        │  validUntil (Date)                                        [Required, Indexed]                        │
        │  isActive (Boolean)                                       [Default true]                             │
        │  createdAt (Date)                                                                                    │
        │  updatedAt (Date)                                                                                    │
        └───────────────────────────────────────┬─────────────────────────────────────────────────────────────┘
                                                │
                                                │ 1
                                                │
                                                ▼
        ┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐
        │                                          COUPON_USAGE                                                │
        │─────────────────────────────────────────────────────────────────────────────────────────────────────│
        │  _id (ObjectId)                                           [PK]                                        │
        │  coupon_id (ObjectId)                                     [FK → Coupons, Required]                   │
        │  order_id (ObjectId)                                      [FK → Orders, Required]                    │
        │  user_id (ObjectId)                                       [FK → Users, Required]                     │
        │  discountAmount (Number)                                  [Actual discount applied]                  │
        │  usedAt (Date)                                            [Default now]                              │
        └─────────────────────────────────────────────────────────────────────────────────────────────────────┘

VALIDATION RULES:
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│  COUPON VALIDATION FLOW:                                                                                     │
│                                                                                                              │
│  1. Check if code exists ──► 2. Check if active ──► 3. Check date range ──► 4. Check usage limit          │
│         │                        │                        │                        │                        │
│         ▼                        ▼                        ▼                        ▼                        │
│    [exists] ✓              [isActive] ✓             [validDate] ✓           [usageLimit] ✓                 │
│                                                                                                              │
│  5. Check per-user limit ──► 6. Check min order ──► 7. Check categories ──► 8. Apply discount              │
│         │                        │                        │                        │                        │
│         ▼                        ▼                        ▼                        ▼                        │
│    [userLimit] ✓            [minOrder] ✓             [categories] ✓          [calculate] ✓                  │
│                                                                                                              │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────┘

EXAMPLE COUPONS:
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│  code: "SAVE100"        |  code: "FLAT50"         |  code: "FESTIVE20"                                      │
│  type: fixed            |  type: percentage       |  type: percentage                                       │
│  value: 100             |  value: 10              |  value: 20                                              │
│  minOrder: 500          |  minOrder: 0            |  minOrder: 1000                                         │
│  maxDiscount: null      |  maxDiscount: 500       |  maxDiscount: 1000                                       │
│  usageLimit: 10000      |  usageLimit: 5000       |  usageLimit: 1000                                       │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### **7. COMPLETE SCHEMA WITH DATA TYPES**

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    COMPLETE DATA TYPES MAP                                                    │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ COLLECTION NAME    │ FIELD NAME        │ DATA TYPE      │ CONSTRAINTS              │ INDEX                  │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ users              │ _id               │ ObjectId       │ PK                       │ _id_                   │
│                    │ name              │ String         │ Required, Min 2, Max 50 │                        │
│                    │ email             │ String         │ Required, Unique        │ email_1 (unique)       │
│                    │ password          │ String         │ Required, Min 6         │                        │
│                    │ role              │ Enum           │ user/admin/vendor       │ role_1                 │
│                    │ phone             │ String         │ 10 digits, Optional     │                        │
│                    │ avatar            │ String         │ URL, Optional           │                        │
│                    │ isActive          │ Boolean        │ Default true            │ isActive_1             │
│                    │ lastLogin         │ Date           │ Optional                │                        │
│                    │ refreshToken      │ String         │ Optional                │ refreshToken_1         │
│                    │ createdAt         │ Date           │ Default now             │ createdAt_-1           │
│                    │ updatedAt         │ Date           │ Auto                    │                        │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ products           │ _id               │ ObjectId       │ PK                       │ _id_                   │
│                    │ name              │ String         │ Required                │ name_text              │
│                    │ slug              │ String         │ Required, Unique        │ slug_1 (unique)        │
│                    │ description       │ String         │ Optional                │ description_text       │
│                    │ price             │ Number         │ Required, Min 0         │ price_1                │
│                    │ category_id       │ ObjectId       │ FK                      │ category_id_1          │
│                    │ brand_id          │ ObjectId       │ FK                      │ brand_id_1             │
│                    │ stock             │ Number         │ Required, Min 0         │ stock_1                │
│                    │ images            │ Array          │ URLs                    │                        │
│                    │ rating            │ Number         │ 0-5, Default 0          │ rating_-1              │
│                    │ numReviews        │ Number         │ Default 0               │                        │
│                    │ specifications    │ Object         │ JSON                    │                        │
│                    │ isActive          │ Boolean        │ Default true            │ isActive_1             │
│                    │ createdAt         │ Date           │ Default now             │ createdAt_-1           │
│                    │ updatedAt         │ Date           │ Auto                    │                        │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ orders             │ _id               │ ObjectId       │ PK                       │ _id_                   │
│                    │ orderId           │ String         │ Required, Unique        │ orderId_1 (unique)     │
│                    │ user_id           │ ObjectId       │ FK, Required            │ user_id_1_createdAt_-1 │
│                    │ items             │ Array          │ Required                │                        │
│                    │ subtotal          │ Number         │ Required                │                        │
│                    │ tax               │ Number         │ Required                │                        │
│                    │ shipping          │ Number         │ Required                │                        │
│                    │ discount          │ Number         │ Default 0               │                        │
│                    │ totalAmount       │ Number         │ Required                │                        │
│                    │ status            │ Enum           │ 7 states                │ status_1               │
│                    │ paymentStatus     │ Enum           │ 4 states                │ paymentStatus_1        │
│                    │ paymentMethod     │ Enum           │ 4 types                 │                        │
│                    │ shippingAddress   │ Object         │ Required                │                        │
│                    │ coupon_id         │ ObjectId       │ FK                      │                        │
│                    │ trackingId        │ String         │ Optional                │ trackingId_1           │
│                    │ deliveredAt       │ Date           │ Optional                │                        │
│                    │ cancelledAt       │ Date           │ Optional                │                        │
│                    │ createdAt         │ Date           │ Default now             │ createdAt_-1           │
│                    │ updatedAt         │ Date           │ Auto                    │                        │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ payments           │ _id               │ ObjectId       │ PK                       │ _id_                   │
│                    │ order_id          │ ObjectId       │ FK, Required, Unique    │ order_id_1 (unique)    │
│                    │ user_id           │ ObjectId       │ FK, Required            │ user_id_1              │
│                    │ amount            │ Number         │ Required                │                        │
│                    │ paymentMethod     │ String         │ Required                │                        │
│                    │ transactionId     │ String         │ Unique                  │ transactionId_1 (unique)│
│                    │ razorpayOrderId   │ String         │ Optional                │                        │
│                    │ razorpayPaymentId │ String         │ Optional                │                        │
│                    │ status            │ Enum           │ 4 states                │ status_1               │
│                    │ failureReason     │ String         │ Optional                │                        │
│                    │ metadata          │ Object         │ Gateway response        │                        │
│                    │ createdAt         │ Date           │ Default now             │ createdAt_1            │
│                    │ updatedAt         │ Date           │ Auto                    │                        │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### **8. RELATIONSHIP SUMMARY TABLE**

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    RELATIONSHIP MATRIX                                                        │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                              │
│  ┌─────────────┬─────────────┬──────────────────┬─────────────────────────────────────────────────────────┐│
│  │  From Table │  To Table   │  Relationship    │  Description                                            ││
│  ├─────────────┼─────────────┼──────────────────┼─────────────────────────────────────────────────────────┤│
│  │  Users      │  Orders     │  One-to-Many     │  One user can have many orders                          ││
│  │  Users      │  Cart       │  One-to-One      │  One user has one cart                                  ││
│  │  Users      │  Wishlist   │  One-to-One      │  One user has one wishlist                              ││
│  │  Users      │  Reviews    │  One-to-Many     │  One user can write many reviews                        ││
│  │  Users      │  Address    │  One-to-Many     │  One user can have many addresses                       ││
│  │  Users      │  Payments   │  One-to-Many     │  One user can make many payments                        ││
│  │  Users      │  Sessions   │  One-to-Many     │  One user can have many sessions                        ││
│  │             │             │                  │                                                         ││
│  │  Products   │  Orders     │  Many-to-Many    │  Through OrderItems                                     ││
│  │  Products   │  Cart       │  Many-to-Many    │  Through CartItems                                      ││
│  │  Products   │  Wishlist   │  Many-to-Many    │  Through WishlistItems                                  ││
│  │  Products   │  Reviews    │  One-to-Many     │  One product can have many reviews                      ││
│  │  Products   │  Inventory  │  One-to-One      │  One product has one inventory record                   ││
│  │  Products   │  Category   │  Many-to-One     │  Many products belong to one category                   ││
│  │  Products   │  Brand      │  Many-to-One     │  Many products belong to one brand                      ││
│  │             │             │                  │                                                         ││
│  │  Orders     │  Payments   │  One-to-One      │  One order has one payment                              ││
│  │  Orders     │  Coupons    │  Many-to-One     │  Many orders can use one coupon                         ││
│  │  Orders     │  Users      │  Many-to-One     │  Many orders belong to one user                         ││
│  │             │             │                  │                                                         ││
│  │  Category   │  Category   │  Self-reference  │  Parent-child category relationship                     ││
│  │             │             │                  │                                                         ││
│  │  Coupons    │  Orders     │  One-to-Many     │  One coupon can be applied to many orders               ││
│  └─────────────┴─────────────┴──────────────────┴─────────────────────────────────────────────────────────┘│
│                                                                                                              │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### **9. SAMPLE DATA FLOW DIAGRAM (Text Format)**

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    DATA FLOW - COMPLETE ORDER PROCESS                                       │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────┘

    USER ACTION                    SYSTEM PROCESS                    DATABASE                     EXTERNAL
                                                                                                       │
    ┌─────────────┐                ┌─────────────┐                   ┌─────────────┐                  │
    │ 1. Add to   │───────────────►│  Cart       │──────────────────►│  Cart DB    │                  │
    │    Cart     │                │  Service    │                   │  (Redis)    │                  │
    └─────────────┘                └─────────────┘                   └─────────────┘                  │
                                                                                                       │
    ┌─────────────┐                ┌─────────────┐                   ┌─────────────┐                  │
    │ 2. Proceed  │───────────────►│  Checkout   │──────────────────►│  Address DB │                  │
    │    to       │                │  Service    │                   │  (MongoDB)  │                  │
    │    Checkout │                └─────────────┘                   └─────────────┘                  │
    └─────────────┘                                                                                   │
                                                                                                       │
    ┌─────────────┐                ┌─────────────┐                   ┌─────────────┐                  │
    │ 3. Apply    │───────────────►│  Coupon     │──────────────────►│  Coupon DB  │                  │
    │    Coupon   │                │  Service    │                   │  (MongoDB)  │                  │
    └─────────────┘                └─────────────┘                   └─────────────┘                  │
                                                                                                       │
    ┌─────────────┐                ┌─────────────┐                   ┌─────────────┐                  │
    │ 4. Place    │───────────────►│  Order      │──────────────────►│  Order DB   │                  │
    │    Order    │                │  Service    │                   │  (MongoDB)  │                  │
    └─────────────┘                └──────┬──────┘                   └─────────────┘                  │
                                          │                                                            │
                                          │ 5. Check Stock          ┌─────────────┐                  │
                                          ├────────────────────────►│  Product DB │                  │
                                          │                         │  (MongoDB)  │                  │
                                          │                         └─────────────┘                  │
                                          │                                                            │
                                          │ 6. Initiate Payment     ┌─────────────┐    ┌───────────┐ │
                                          ├────────────────────────►│  Payment DB │───►│ Razorpay  │ │
                                          │                         └─────────────┘    │ Gateway   │ │
                                          │                                            └───────────┘ │
                                          │ 7. Create Invoice       ┌─────────────┐                  │
                                          ├────────────────────────►│  Invoice    │                  │
                                          │                         │  Generator  │                  │
                                          │                         └─────────────┘                  │
                                          │                                                            │
                                          │ 8. Send Email           ┌─────────────┐    ┌───────────┐ │
                                          ├────────────────────────►│  Email      │───►│ SendGrid  │ │
                                          │                         │  Queue      │    │           │ │
                                          │                         └─────────────┘    └───────────┘ │
                                          │                                                            │
                                          │ 9. Update Inventory     ┌─────────────┐                  │
                                          ├────────────────────────►│  Inventory  │                  │
                                          │                         │  DB         │                  │
                                          │                         └─────────────┘                  │
                                          │                                                            │
                                          │ 10. Return Response     ┌─────────────┐                  │
                                          └────────────────────────►│  Client     │                  │
                                                                     └─────────────┘                  │

┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│  LEGEND:                                                                                                     │
│  ───────►  Synchronous API call                                                                              │
│  - - - -►  Asynchronous Queue/Event                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

This complete ER diagram shows **every table, field, relationship, data type, and index** for your Flipkart Clone project. You can use this directly for database implementation! 🎯
