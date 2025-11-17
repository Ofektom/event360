# Event360 Architecture Documentation

## Overview

This project follows a **layered architecture** pattern, similar to Java Spring Boot or Python FastAPI, with clear separation of concerns.

## Architecture Layers

```
┌─────────────────────────────────────┐
│   API Routes (Controllers)          │  ← HTTP handling, request/response
├─────────────────────────────────────┤
│   Services (Business Logic)         │  ← Business rules, validation
├─────────────────────────────────────┤
│   Repositories (Data Access)        │  ← Database operations
├─────────────────────────────────────┤
│   Prisma Client (ORM)               │  ← Database abstraction
└─────────────────────────────────────┘
```

## Folder Structure

```
src/
├── app/
│   └── api/                          # API Routes (Controllers)
│       └── events/
│           └── route.ts              # GET, POST /api/events
│
├── services/                         # Service Layer (Business Logic)
│   ├── event.service.ts
│   ├── ceremony.service.ts
│   ├── schedule.service.ts
│   ├── invitee.service.ts
│   ├── media.service.ts
│   └── interaction.service.ts
│
├── repositories/                     # Repository Layer (Data Access)
│   ├── event.repository.ts
│   ├── ceremony.repository.ts
│   ├── schedule.repository.ts
│   ├── invitee.repository.ts
│   ├── media.repository.ts
│   └── interaction.repository.ts
│
├── types/                            # DTOs, Interfaces, Enums
│   ├── enums.ts                      # All enums
│   ├── event.types.ts                # Event DTOs
│   ├── ceremony.types.ts
│   ├── schedule.types.ts
│   ├── invitee.types.ts
│   ├── media.types.ts
│   └── interaction.types.ts
│
└── lib/
    └── prisma.ts                     # Prisma Client singleton
```

## Layer Responsibilities

### 1. API Routes (Controllers)
**Location:** `src/app/api/**/route.ts`

**Responsibilities:**
- Handle HTTP requests/responses
- Parse request data
- Call appropriate service methods
- Return HTTP responses with proper status codes
- Error handling and status code mapping

**Example:**
```typescript
// src/app/api/events/route.ts
export async function GET(request: NextRequest) {
  const events = await eventService.getEvents(filters)
  return NextResponse.json(events)
}
```

### 2. Services (Business Logic)
**Location:** `src/services/*.service.ts`

**Responsibilities:**
- Business logic and validation
- Data transformation
- Business rules enforcement
- Orchestrating multiple repository calls
- Throwing business exceptions

**Example:**
```typescript
// src/services/event.service.ts
async createEvent(data: CreateEventDto): Promise<Event> {
  // Business validation
  if (!data.title || !data.ownerId) {
    throw new Error('Title and owner ID are required')
  }
  
  // Business logic (slug generation, QR code, etc.)
  const slug = this.generateSlug(data.title)
  
  // Call repository
  return this.eventRepository.create({...data, slug})
}
```

### 3. Repositories (Data Access)
**Location:** `src/repositories/*.repository.ts`

**Responsibilities:**
- Database operations (CRUD)
- Query building
- Data mapping
- No business logic

**Example:**
```typescript
// src/repositories/event.repository.ts
async findAll(filters: GetEventsFilters) {
  return prisma.event.findMany({
    where: { ownerId: filters.ownerId },
    include: { theme: true, ceremonies: true }
  })
}
```

### 4. Types (DTOs & Enums)
**Location:** `src/types/*.types.ts` and `src/types/enums.ts`

**Responsibilities:**
- Type definitions
- Request/Response DTOs
- Enums
- Interfaces

**Example:**
```typescript
// src/types/event.types.ts
export interface CreateEventDto {
  title: string
  description?: string
  ownerId: string
  // ...
}
```

## Data Flow Example

### Creating an Event

1. **Client** → `POST /api/events`
2. **API Route** (`route.ts`) → Parses request, calls service
3. **Service** (`event.service.ts`) → Validates, applies business logic
4. **Repository** (`event.repository.ts`) → Executes database query
5. **Prisma** → Saves to database
6. **Response flows back** through layers

```
Client Request
    ↓
API Route (Controller)
    ↓
Service (Business Logic)
    ↓
Repository (Data Access)
    ↓
Prisma Client
    ↓
PostgreSQL Database
```

## Benefits of This Architecture

1. **Separation of Concerns**: Each layer has a single responsibility
2. **Testability**: Easy to mock repositories and test services
3. **Maintainability**: Changes in one layer don't affect others
4. **Reusability**: Services can be used from API routes, server actions, etc.
5. **Scalability**: Easy to add new features without bloating controllers

## Adding a New Feature

### Example: Adding a "Theme" feature

1. **Create Types** (`src/types/theme.types.ts`)
   ```typescript
   export interface CreateThemeDto { ... }
   ```

2. **Create Repository** (`src/repositories/theme.repository.ts`)
   ```typescript
   export class ThemeRepository { ... }
   ```

3. **Create Service** (`src/services/theme.service.ts`)
   ```typescript
   export class ThemeService {
     constructor() {
       this.themeRepository = new ThemeRepository()
     }
   }
   ```

4. **Create API Route** (`src/app/api/themes/route.ts`)
   ```typescript
   const themeService = new ThemeService()
   export async function GET() { ... }
   ```

## Best Practices

1. **Controllers should be thin**: Only handle HTTP concerns
2. **Services contain business logic**: Validation, transformations, rules
3. **Repositories only do data access**: No business logic
4. **Use DTOs**: Always define types for requests/responses
5. **Error handling**: Services throw errors, controllers map to HTTP status codes
6. **Dependency injection**: Services instantiate repositories (can be improved with DI container)

## Comparison with Other Frameworks

| Layer | Java Spring Boot | Python FastAPI | Next.js (This Project) |
|-------|------------------|----------------|------------------------|
| **Controller** | `@RestController` | `@app.get()` | `route.ts` (GET/POST) |
| **Service** | `@Service` | Service class | `services/*.service.ts` |
| **Repository** | `@Repository` | Repository class | `repositories/*.repository.ts` |
| **DTO** | DTO class | Pydantic model | `types/*.types.ts` |
| **Enum** | `enum` | `Enum` | `types/enums.ts` |

## Next Steps

- [ ] Add dependency injection container (e.g., `tsyringe`)
- [ ] Add validation layer (e.g., `zod` for runtime validation)
- [ ] Add middleware for authentication/authorization
- [ ] Add error handling middleware
- [ ] Add logging service
- [ ] Add unit tests for services
- [ ] Add integration tests for repositories

