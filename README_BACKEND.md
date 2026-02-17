# Mnandi Backend API - Spring Boot

Professional Spring Boot backend for the Mnandi food ordering system, demonstrating enterprise Java development practices with a hybrid Google Sheets + Database architecture.

## 📊 Quick Overview

| Feature | Technology |
|---------|-----------|
| **Framework** | Spring Boot 3.2.2 |
| **Language** | Java 17 |
| **Menu Data** | Google Sheets (CSV) |
| **Order Storage** | H2 Database |
| **API Style** | RESTful |
| **Build Tool** | Maven |

## 🚀 Quick Start

See [BACKEND_QUICK_START.md](./BACKEND_QUICK_START.md) for 5-minute setup instructions.

## 🏗️ Architecture

See [BACKEND_ARCHITECTURE.md](./BACKEND_ARCHITECTURE.md) for detailed system architecture with diagrams and data flow.

## 📡 API Endpoints Summary

### Menu API
- `GET /api/menu` - Get all menu items
- `GET /api/menu/status` - Get business hours
- `GET /api/menu/health` - Health check

### Orders API
- `POST /api/orders` - Create order
- `GET /api/orders` - List all orders
- `GET /api/orders/{confirmationNumber}` - Track order
- `PATCH /api/orders/{id}/status` - Update status
- `GET /api/orders/status/{status}` - Filter by status
- `GET /api/orders/today` - Today's orders
- `GET /api/orders/stats` - Order statistics

### Customers API
- `GET /api/customers` - List customers
- `GET /api/customers/{id}` - Get by ID
- `GET /api/customers/phone/{phone}` - Get by phone
- `GET /api/customers/stats` - Customer statistics

## 🛠️ Setup & Installation

### Prerequisites
- Java 17+ ([Download](https://adoptium.net/))
- Maven 3.6+ ([Download](https://maven.apache.org/download.cgi))

### Installation

```bash
# Clone or navigate to project
cd c:\Users\Themba\mnandi-flamed-grilled-1

# Build project
mvn clean install

# Run application
mvn spring-boot:run
```

Server starts on: **http://localhost:8080**

### Configure Google Sheets

1. Publish your Google Sheets as CSV (File → Share → Publish to web)
2. Update URLs in `src/main/resources/application.properties`:

```properties
google.sheets.menu.url=YOUR_MENU_CSV_URL
google.sheets.sides.url=YOUR_SIDES_CSV_URL
```

## 📝 API Usage Examples

### Create Order

```bash
curl -X POST http://localhost:8080/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "John Doe",
    "customerPhone": "0712345678",
    "customerRoom": "204",
    "customerResidence": "Main Hall",
    "items": "[{\"name\":\"Full Chicken\",\"price\":150}]",
    "total": 150,
    "notes": "Extra sauce"
  }'
```

### Track Order

```bash
curl http://localhost:8080/api/orders/MND45678
```

### Get Statistics

```bash
curl http://localhost:8080/api/orders/stats
```

Response:
```json
{
  "totalOrders": 25,
  "todayOrders": 8,
  "pendingOrders": 3,
  "totalRevenue": 3750.0,
  "averageOrderValue": 150.0
}
```

## 🔧 Development

### Project Structure

```
src/main/java/com/mnandi/
├── config/
│   └── CorsConfig.java              # CORS configuration
├── controller/
│   ├── MenuController.java          # Menu endpoints
│   ├── OrderController.java         # Order management
│   └── CustomerController.java      # Customer operations
├── dto/
│   ├── MenuItemDTO.java            # Menu data transfer object
│   └── BusinessStatusDTO.java      # Business hours DTO
├── model/
│   ├── Order.java                  # Order entity
│   └── Customer.java               # Customer entity
├── repository/
│   ├── OrderRepository.java        # Order data access
│   └── CustomerRepository.java     # Customer data access
├── service/
│   ├── GoogleSheetsService.java    # Google Sheets integration
│   ├── OrderService.java           # Order business logic
│   └── CustomerService.java        # Customer business logic
└── MnandiApplication.java          # Main application class
```

### Key Features Implementation

**Auto-Generated Confirmation Numbers**
```java
private String generateConfirmationNumber() {
    Random random = new Random();
    int number = 10000 + random.nextInt(90000);
    return "MND" + number;  // e.g., MND45678
}
```

**Automatic Customer Creation**
When an order is placed, the system automatically:
1. Checks if customer exists (by phone)
2. Creates new customer OR updates existing
3. Tracks total spent, order count, dates

**Google Sheets CSV Parsing**
- Uses Apache Commons CSV library
- Handles both Menu and Sides sheets
- Flexible column mapping
- Fallback to defaults if unavailable

## 🗄️ Database

### H2 Console Access
- URL: http://localhost:8080/h2-console
- JDBC URL: `jdbc:h2:file:./data/mnandi`
- Username: `sa`
- Password: *(blank)*

### Database Schema

**orders** table:
- `id`, `confirmation_number` (unique)
- `customer_name`, `customer_phone`, `customer_room`, `customer_residence`
- `items` (JSON), `total`, `status`, `notes`
- `created_at`, `updated_at`

**customers** table:
- `id`, `name`, `phone` (unique)
- `room`, `residence`
- `total_spent`, `order_count`
- `first_order_date`, `last_order_date`, `created_at`

## 🔐 CORS Configuration

Configured to accept requests from:
- `http://localhost:3000` - Next.js development
- `https://*.vercel.app` - Production deployments

## 🚀 Deployment

### Build JAR

```bash
mvn clean package
```

JAR location: `target/mnandi-backend-1.0.0.jar`

### Run JAR

```bash
java -jar target/mnandi-backend-1.0.0.jar
```

### Deploy to Cloud

**Render.com (Free)**
- Build: `mvn clean install`
- Start: `java -jar target/mnandi-backend-1.0.0.jar`

**Railway.app**
- Auto-detects Spring Boot
- No configuration needed

**Heroku**
```bash
heroku create mnandi-backend
git push heroku main
```

## 🧪 Testing

### Run Tests
```bash
mvn test
```

### Test Endpoints
```bash
# Health check
curl http://localhost:8080/api/menu/health

# Get menu
curl http://localhost:8080/api/menu

# Create test order
curl -X POST http://localhost:8080/api/orders \
  -H "Content-Type: application/json" \
  -d '{"customerName":"Test","customerPhone":"0700000000","customerRoom":"101","customerResidence":"Test","items":"[]","total":100}'
```

## 📚 Technologies Used

- **Spring Boot 3.2.2** - Application framework
- **Spring Data JPA** - Database abstraction
- **H2 Database** - Embedded SQL database
- **Apache Commons CSV 1.10.0** - CSV parsing
- **Lombok** - Boilerplate reduction
- **Jakarta Validation** - Input validation
- **Maven** - Build and dependency management

## 🎓 Portfolio Highlights

This backend demonstrates:

✅ **RESTful API Design** - Proper HTTP methods, status codes, resource naming

✅ **Layered Architecture** - Controller → Service → Repository separation

✅ **Design Patterns** - Repository, Service Layer, DTO patterns

✅ **External Integration** - Google Sheets CSV fetching and parsing

✅ **Data Persistence** - JPA/Hibernate with lifecycle callbacks

✅ **Auto-generation Logic** - Confirmation numbers, customer tracking

✅ **Error Handling** - Try-catch blocks, proper logging

✅ **Configuration Management** - application.properties, CORS

✅ **Production Ready** - Logging, validation, transaction management

Perfect for showcasing on:
- Bursary applications
- GitHub portfolio
- Job applications
- Technical interviews

## 📖 Documentation

- **[BACKEND_QUICK_START.md](./BACKEND_QUICK_START.md)** - 5-minute setup guide
- **[BACKEND_ARCHITECTURE.md](./BACKEND_ARCHITECTURE.md)** - System architecture with diagrams
- **[Frontend README.md](./README.md)** - Full system overview

## 🤝 Integration with Frontend

Set environment variable in your Next.js app:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

Then use in your components:
```javascript
const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Fetch menu
const menu = await fetch(`${API_URL}/menu`).then(r => r.json());

// Create order
await fetch(`${API_URL}/orders`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(orderData)
});
```

## 🐛 Troubleshooting

**Port 8080 in use:**
```bash
# Windows
netstat -ano | findstr :8080
taskkill /PID <PID> /F
```

**Build errors:**
```bash
mvn clean
mvn dependency:purge-local-repository
mvn install
```

**Google Sheets not loading:**
- Verify sheets are published as CSV (not just shared)
- Check URLs in `application.properties`
- Test CSV URL in browser (should download file)

## 📧 Support

For issues:
1. Check application logs in console
2. Verify H2 database in console
3. Test endpoints with curl/Postman
4. Check Google Sheets are published correctly

---

**Built with professional Java development practices for portfolio and bursary applications**
