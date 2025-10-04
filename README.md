# Replica Demo Backend

A Node.js/TypeScript backend application demonstrating database replication with PostgreSQL read replicas, RabbitMQ message queuing, and load balancing for high availability and performance.

## 🏗️ Architecture Overview

This project implements a **master-slave database replication pattern** with the following components:

- **Primary Database (Write)**: Handles all write operations (CREATE, UPDATE, DELETE)
- **Read Replicas**: Two PostgreSQL replicas for read operations with load balancing
- **Message Queue**: RabbitMQ for asynchronous data synchronization between databases
- **Load Balancing**: Round-robin distribution of read requests across replicas

## 🚀 Features

- **Database Replication**: Automatic synchronization between primary and replica databases
- **Load Balancing**: Intelligent distribution of read operations across multiple replicas
- **Message Queue Integration**: Asynchronous data replication using RabbitMQ
- **RESTful API**: Complete CRUD operations for product management
- **Error Handling**: Comprehensive error handling with retry mechanisms
- **Docker Support**: Full containerization with Docker and Docker Compose
- **TypeScript**: Type-safe development with full TypeScript support

## 🛠️ Tech Stack

- **Runtime**: Node.js 18
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL (Primary + 2 Replicas)
- **ORM**: Prisma
- **Message Queue**: RabbitMQ
- **Containerization**: Docker & Docker Compose
- **Development**: Nodemon, ts-node

## 📁 Project Structure

```
src/
├── controllers/          # Request handlers
│   └── product.controller.ts
├── services/            # Business logic
│   ├── product.service.ts
│   └── prisma.service.ts
├── routes/              # API routes
│   ├── index.ts
│   └── product.routes.ts
├── queue/               # Message queue implementation
│   ├── consumer.ts
│   └── rabitmq.ts
├── dto/                 # Data transfer objects
│   └── queue.dto.ts
├── utils/               # Utility functions
│   └── response.handler.ts
├── scripts/             # Utility scripts
│   └── resetAllReadDB.ts
├── appConfig.ts         # Application configuration
└── index.ts            # Application entry point
```

## 🗄️ Database Schema

### Product Model
```prisma
model Product {
  id          String   @id @default(uuid())
  name        String
  price       Float
  stock       Int
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- Git

### Environment Variables

Create a `.env` file in the root directory:

```env
# Database URLs
DATABASE_URL="postgresql://user:password@localhost:5432/products"
REPLICA_1_URL="postgresql://user:password@localhost:5433/products"
REPLICA_2_URL="postgresql://user:password@localhost:5434/products"

# RabbitMQ
RABBITMQ_URL="amqp://user:password@localhost:5672"

# Application
PORT=8000
```

### Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Replica-Demo-Back-End
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the infrastructure**
   ```bash
   # Start databases and RabbitMQ
   docker-compose up -d postgres-primary postgres-replica-1 postgres-replica-2 rabbitmq
   ```

4. **Run database migrations**
   ```bash
   npx prisma migrate dev
   ```

5. **Generate Prisma client**
   ```bash
   npx prisma generate
   ```

6. **Start the application**
   ```bash
   # Development mode
   npm run start:dev

   # Production mode
   npm run build
   npm start
   ```

### Using Docker Compose (Full Stack)

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop all services
docker-compose down
```

## 📡 API Endpoints

### Products

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/products` | Get all products (load balanced across replicas) |
| `POST` | `/api/products` | Create a new product |
| `DELETE` | `/api/products/:id` | Delete a product by ID |

### Request/Response Examples

#### Create Product
```bash
POST /api/products
Content-Type: application/json

{
  "id": "uuid-here",
  "name": "Sample Product",
  "price": 99.99,
  "stock": 100
}
```

#### Get Products
```bash
GET /api/products
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-here",
      "name": "Sample Product",
      "price": 99.99,
      "stock": 100,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "message": "Products retrieved successfully"
}
```

## 🔄 How Replication Works

### Write Operations
1. Client sends write request to API
2. Data is written to primary database
3. Message is sent to RabbitMQ queue
4. Consumer processes message and replicates to all read replicas
5. Response is sent back to client

### Read Operations
1. Client sends read request to API
2. Load balancer selects a read replica (round-robin)
3. Data is fetched from selected replica
4. Response is sent back to client

### Error Handling & Retries
- Failed replication operations are retried up to 3 times
- Exponential backoff for retry delays
- Failed messages are rejected after max retries

## 🛠️ Available Scripts

```bash
# Development
npm run start:dev     # Start with nodemon (auto-reload)

# Production
npm run build         # Build TypeScript to JavaScript
npm start            # Start production server

# Database
npm run reset-data   # Reset and sync all read databases
```

## 🐳 Docker Services

| Service | Port | Description |
|---------|------|-------------|
| `postgres-primary` | 5432 | Primary database (writes) |
| `postgres-replica-1` | 5433 | First read replica |
| `postgres-replica-2` | 5434 | Second read replica |
| `rabbitmq` | 5672, 15672 | Message queue & management UI |
| `backend` | 8000 | Application server |

## 🔧 Configuration

### Load Balancing Strategy
- **Round-robin**: Requests are distributed sequentially across replicas
- **Random**: Alternative random selection (available but not used by default)

### Message Queue Configuration
- **Queues**: `products.sync`, `products.delete`
- **Retry Policy**: 3 attempts with 1-second delay
- **Message Persistence**: Enabled for reliability

## 🧪 Testing the Replication

1. **Create a product** and verify it appears in all databases
2. **Check RabbitMQ management UI** at `http://localhost:15672` (user/password)
3. **Monitor logs** to see load balancing in action
4. **Use the reset script** to test full synchronization

## 📊 Monitoring

### RabbitMQ Management
- URL: `http://localhost:15672`
- Username: `user`
- Password: `password`

### Database Connections
- Primary: `postgresql://user:password@localhost:5432/products`
- Replica 1: `postgresql://user:password@localhost:5433/products`
- Replica 2: `postgresql://user:password@localhost:5434/products`

## 🚨 Troubleshooting

### Common Issues

1. **Database connection errors**
   - Ensure all PostgreSQL containers are running
   - Check environment variables in `.env`

2. **RabbitMQ connection issues**
   - Verify RabbitMQ container is running
   - Check queue names in `src/dto/queue.dto.ts`

3. **Replication not working**
   - Check RabbitMQ management UI for message queues
   - Verify consumer is running (check application logs)

### Reset Everything
```bash
# Stop all containers
docker-compose down

# Remove volumes (WARNING: This deletes all data)
docker-compose down -v

# Restart everything
docker-compose up -d
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the ISC License.

## 🔗 Related

- [Prisma Documentation](https://www.prisma.io/docs)
- [RabbitMQ Documentation](https://www.rabbitmq.com/documentation.html)
- [Express.js Documentation](https://expressjs.com/)
- [Docker Documentation](https://docs.docker.com/)
