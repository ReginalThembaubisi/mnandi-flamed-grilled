# Mnandi Backend Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT TIER                              │
│  ┌──────────────┐          ┌──────────────┐                    │
│  │  Next.js     │          │   Admin      │                    │
│  │  Frontend    │          │   Dashboard  │                    │
│  └──────────────┘          └──────────────┘                    │
└─────────────────┬───────────────────┬──────────────────────────┘
                  │    HTTP/REST      │
                  │    (Port 8080)    │
┌─────────────────┴───────────────────┴──────────────────────────┐
│                      SPRING BOOT BACKEND                         │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                   CONTROLLER LAYER                         │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐     │ │
│  │  │ MenuCtrl    │ │ OrderCtrl   │ │ CustomerCtrl    │     │ │
│  │  │ /api/menu   │ │ /api/orders │ │ /api/customers  │     │ │
│  │  └─────────────┘ └─────────────┘ └─────────────────┘     │ │
│  └───────────────────────────────────────────────────────────┘ │
│                             │                                    │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                    SERVICE LAYER                           │ │
│  │  ┌──────────────┐ ┌──────────────┐ ┌─────────────────┐   │ │
│  │  │ Google       │ │ Order        │ │ Customer        │   │ │
│  │  │ SheetsService│ │ Service      │ │ Service         │   │ │
│  │  └──────────────┘ └──────────────┘ └─────────────────┘   │ │
│  └───────────────────────────────────────────────────────────┘ │
│                             │                                    │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                  REPOSITORY LAYER                          │ │
│  │  ┌──────────────────┐         ┌──────────────────┐        │ │
│  │  │ OrderRepository  │         │ CustomerRepo     │        │ │
│  │  │ (JPA)            │         │ (JPA)            │        │ │
│  │  └──────────────────┘         └──────────────────┘        │ │
│  └───────────────────────────────────────────────────────────┘ │
└──────────────┬────────────────────────────┬────────────────────┘
               │                            │
┌──────────────┴─────────────┐   ┌──────────┴──────────────────┐
│   GOOGLE SHEETS (CSV)      │   │   H2 DATABASE               │
│                             │   │                             │
│  ┌──────────────┐          │   │  ┌──────────┐              │
│  │  Menu Sheet  │          │   │  │ Orders   │              │
│  │  Sides Sheet │          │   │  │ Customers│              │
│  │  Hours Sheet │          │   │  └──────────┘              │
│  └──────────────┘          │   │                             │
└────────────────────────────┘   └─────────────────────────────┘
```

## Hybrid Architecture Explained

### Why Two Data Sources?

**Google Sheets for Menu**
- ✅ Non-technical menu updates (no code deployment)
- ✅ Real-time price changes
- ✅ Quick availability toggles
- ✅ Easy collaboration

**H2 Database for Orders/Customers**
- ✅ ACID transactions
- ✅ Complex queries and analytics
- ✅ Data integrity
- ✅ Customer relationship tracking

## Layer Breakdown

### 1. Controller Layer (REST API)

**MenuController** (`/api/menu`)
- `GET /` - Fetch combined menu (Menu + Sides sheets)
- `GET /status` - Business hours
- `GET /health` - Health check

**OrderController** (`/api/orders`)
- `POST /` - Create order
- `GET /` - List all orders
- `GET /{confirmationNumber}` - Track order
- `PATCH /{id}/status` - Update status
- `GET /status/{status}` - Filter by status
- `GET /today` - Today's orders
- `GET /stats` - Statistics

**CustomerController** (`/api/customers`)
- `GET /` - List all customers
- `GET /{id}` - Get by ID
- `GET /phone/{phone}` - Get by phone
- `GET /stats` - Customer metrics

### 2. Service Layer (Business Logic)

**GoogleSheetsService**
- HTTP GET requests to published CSV URLs
- Apache Commons CSV parsing
- Combines Menu + Sides sheets
- Fallback to defaults if unavailable

**OrderService**
- Auto-generates confirmation numbers (MND12345)
- Triggers customer creation/update
- Calculates order statistics
- Transaction management

**CustomerService**
- Auto-creates customers from orders
- Updates spending and order count
- Tracks first/last order dates
- Revenue analytics

### 3. Repository Layer (Data Access)

**OrderRepository**
- Extends `JpaRepository<Order, Long>`
- Custom queries: `findByConfirmationNumber`, `findByStatus`
- Date range queries for "today's orders"

**CustomerRepository**
- Extends `JpaRepository<Customer, Long>`
- Unique phone constraint
- Sorted by total spent

### 4. Model Layer (Entities & DTOs)

**Order Entity**
```java
┌─────────────────────────────┐
│ Order                       │
├─────────────────────────────┤
│ id (PK)                     │
│ confirmationNumber (Unique) │
│ customerName                │
│ customerPhone               │
│ customerRoom                │
│ customerResidence           │
│ items (JSON)                │
│ total                       │
│ status                      │
│ notes                       │
│ createdAt                   │
│ updatedAt                   │
└─────────────────────────────┘
```

**Customer Entity**
```java
┌─────────────────────────────┐
│ Customer                    │
├─────────────────────────────┤
│ id (PK)                     │
│ name                        │
│ phone (Unique)              │
│ room                        │
│ residence                   │
│ totalSpent                  │
│ orderCount                  │
│ firstOrderDate              │
│ lastOrderDate               │
│ createdAt                   │
└─────────────────────────────┘
```

## Data Flow

### Order Creation Flow

```
1. POST /api/orders
   │
   ├─→ OrderController receives order
   │
   ├─→ OrderService.createOrder()
   │   ├─→ Generate confirmation number (MND + 5 digits)
   │   ├─→ Save order to database
   │   └─→ CustomerService.createOrUpdateCustomer()
   │       ├─→ Check if customer exists (by phone)
   │       ├─→ If exists: Update totalSpent, orderCount
   │       └─→ If new: Create customer record
   │
   └─→ Return saved order with confirmation number
```

### Menu Fetch Flow

```
1. GET /api/menu
   │
   ├─→ MenuController.getMenu()
   │
   ├─→ GoogleSheetsService.fetchMenuItems()
   │   ├─→ HTTP GET to Menu CSV URL
   │   ├─→ Parse CSV (Apache Commons CSV)
   │   ├─→ HTTP GET to Sides CSV URL
   │   ├─→ Parse CSV
   │   └─→ Combine both into MenuItemDTO[]
   │
   └─→ Return combined menu
```

## Configuration

### application.properties

```properties
# Server
server.port=8080

# Database (H2)
spring.datasource.url=jdbc:h2:file:./data/mnandi
spring.h2.console.enabled=true

# Google Sheets CSV URLs
google.sheets.menu.url=...
google.sheets.sides.url=...
google.sheets.business.url=...

# JPA
spring.jpa.hibernate.ddl-auto=update
```

### CORS Configuration

Allows requests from:
- `http://localhost:3000` (Next.js dev)
- `https://*.vercel.app` (Production)

Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS

## Design Patterns Used

1. **Repository Pattern**: Data access abstraction
2. **Service Layer Pattern**: Business logic separation
3. **DTO Pattern**: Data transfer objects
4. **Dependency Injection**: Spring IoC container
5. **RESTful Design**: Resource-based URLs

## Technology Stack

- **Spring Boot 3.2.2**: Application framework
- **Spring Data JPA**: ORM and repositories
- **H2 Database**: Embedded SQL database
- **Apache Commons CSV 1.10.0**: CSV parsing
- **Lombok**: Boilerplate reduction
- **Jakarta Validation**: Bean validation
- **SLF4J + Logback**: Logging

## Scalability Considerations

### Current Architecture (MVP)
- H2 embedded database
- In-memory caching
- Single server instance

### Production Scaling Path
1. **Database**: Migrate H2 → PostgreSQL/MySQL
2. **Caching**: Add Redis for menu caching
3. **Load Balancing**: Multiple backend instances
4. **Message Queue**: Add RabbitMQ for async processing
5. **Containerization**: Docker + Kubernetes

### Migration Example (H2 → PostgreSQL)

```properties
# Change in application.properties
spring.datasource.url=jdbc:postgresql://localhost:5432/mnandi
spring.datasource username=mnandi_user
spring.datasource.password=secure_password
spring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect
```

No code changes needed - JPA abstracts database!

## Error Handling

- **Try-Catch Blocks**: All service methods
- **HTTP Status Codes**: Proper REST responses
- **Logging**: SLF4J logger in all layers
- **Validation**: Jakarta Bean Validation annotations

## Security Considerations

**Current (Development)**
- CORS enabled for localhost + Vercel
- No authentication on endpoints
- H2 console accessible

**Production Recommendations**
1. Add Spring Security
2. JWT authentication for admin endpoints
3. Disable H2 console
4. HTTPS only
5. Rate limiting
6. Input sanitization

## Monitoring & Observability

**Built-in:**
- Health check endpoint: `/api/menu/health`
- Console logging (SLF4J)
- H2 console for database inspection

**Production Additions:**
- Spring Boot Actuator
- Prometheus metrics
- Application Performance Monitoring (APM)

---

This architecture balances:
✅ **Simplicity** - Easy to understand and maintain
✅ **Flexibility** - Google Sheets for menu management
✅ **Reliability** - Database for critical order data
✅ **Scalability** - Clear upgrade path for growth
