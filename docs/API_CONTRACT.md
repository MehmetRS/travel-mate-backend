# Travel Mate API Contract

## Version: 1.0.0

This document defines the stable API contract for Travel Mate backend. All endpoints MUST maintain backward compatibility.

## Response Contract Rules

1. **Never remove or rename existing fields** - Existing clients rely on them
2. **New fields must be optional/nullable** - Don't break existing parsers
3. **Consistent error codes** - 400 (bad request), 401 (unauthorized), 403 (forbidden), 404 (not found), 409 (conflict), 500 (server error)
4. **Flat JSON responses** - No inconsistent wrappers like `{data:...}` vs `{trip:...}`
5. **Consistent field types** - Dates as ISO strings, IDs as strings, etc.

## Endpoints

### Authentication

#### POST /auth/login
**Auth Required:** No  
**Body:**
```json
{
  "email": "string (email)",
  "password": "string (min 6 chars)"
}
```
**Response (200):**
```json
{
  "accessToken": "string",
  "user": {
    "id": "string",
    "email": "string",
    "name": "string | null"
  }
}
```
**Errors:** 400, 401

#### POST /auth/register
**Auth Required:** No  
**Body:**
```json
{
  "email": "string (email)",
  "name": "string",
  "password": "string (min 6 chars)"
}
```
**Response (200):**
```json
{
  "accessToken": "string",
  "user": {
    "id": "string",
    "email": "string",
    "name": "string | null"
  }
}
```
**Errors:** 400, 409

#### GET /auth/me
**Auth Required:** Yes  
**Response (200):**
```json
{
  "sub": "string (user id)",
  "email": "string"
}
```
**Errors:** 401

---

### Trips (Public Read, Auth Write)

#### GET /trips
**Auth Required:** No  
**Response (200):**
```json
[
  {
    "id": "string",
    "origin": "string",
    "destination": "string",
    "departureDateTime": "ISO DateTime",
    "price": "number",
    "totalSeats": "number",
    "availableSeats": "number",
    "isFull": "boolean",
    "description": "string | undefined",
    "driver": {
      "id": "string",
      "name": "string",
      "rating": "number",
      "isVerified": "boolean",
      "vehicle": {
        "vehicleType": "string",
        "brand": "string",
        "model": "string",
        "seats": "number"
      } | null
    }
  }
]
```

#### GET /trips/:id
**Auth Required:** No  
**Response (200):** Same as GET /trips item, plus:
```json
{
  "createdAt": "ISO DateTime"
}
```
**Errors:** 404

#### POST /trips
**Auth Required:** Yes  
**Body:**
```json
{
  "origin": "string",
  "destination": "string",
  "departureDateTime": "ISO DateTime (future)",
  "price": "number (>= 0)",
  "availableSeats": "number (>= 1)",
  "description": "string (optional)",
  "vehicleId": "string UUID (optional)"
}
```
**Response (200):** Same as GET /trips/:id  
**Errors:** 400, 401

---

### Trip Requests (New Domain)

#### POST /trips/:tripId/requests
**Auth Required:** Yes  
**Body:**
```json
{
  "type": "BOOKING | CHAT",
  "seatsRequested": "number (required if type=BOOKING, min 1)"
}
```
**Response (201):**
```json
{
  "id": "string",
  "tripId": "string",
  "requesterId": "string",
  "type": "BOOKING | CHAT",
  "status": "PENDING",
  "seatsRequested": "number | null",
  "createdAt": "ISO DateTime"
}
```
**Errors:** 400, 401, 403, 404, 409

#### GET /trips/:tripId/requests
**Auth Required:** Yes (must be trip owner)  
**Response (200):**
```json
[
  {
    "id": "string",
    "tripId": "string",
    "requesterId": "string",
    "requester": {
      "id": "string",
      "name": "string",
      "rating": "number",
      "isVerified": "boolean"
    },
    "type": "BOOKING | CHAT",
    "status": "PENDING | ACCEPTED | REJECTED | CANCELLED",
    "seatsRequested": "number | null",
    "createdAt": "ISO DateTime",
    "updatedAt": "ISO DateTime"
  }
]
```
**Errors:** 401, 403, 404

#### PATCH /requests/:requestId
**Auth Required:** Yes (trip owner for accept/reject, requester for cancel)  
**Body:**
```json
{
  "action": "ACCEPT | REJECT | CANCEL"
}
```
**Response (200):**
```json
{
  "id": "string",
  "tripId": "string",
  "requesterId": "string",
  "type": "BOOKING | CHAT",
  "status": "ACCEPTED | REJECTED | CANCELLED",
  "seatsRequested": "number | null",
  "createdAt": "ISO DateTime",
  "updatedAt": "ISO DateTime",
  "chatId": "string | null (present if chat created)"
}
```
**Errors:** 400, 401, 403, 404, 409

---

### Chats

#### GET /trips/:tripId/chat
**Auth Required:** Yes (must be member)  
**Response (200):**
```json
{
  "exists": "boolean",
  "chatId": "string | undefined",
  "messages": [
    {
      "id": "string",
      "content": "string",
      "senderId": "string",
      "createdAt": "ISO DateTime",
      "messageType": "TEXT | IMAGE | LOCATION",
      "metadata": "object | null"
    }
  ] | undefined
}
```
**Errors:** 401, 403, 404

#### POST /trips/:tripId/chat/messages
**Auth Required:** Yes (must be member)  
**Body:**
```json
{
  "content": "string",
  "messageType": "TEXT | IMAGE | LOCATION (optional, default TEXT)",
  "metadata": "object (optional, for LOCATION/IMAGE data)"
}
```
**Response (200):** Same as GET /trips/:tripId/chat  
**Errors:** 400, 401, 403, 404

---

### Payments (MVP)

#### POST /trips/:tripId/payments
**Auth Required:** Yes  
**Body:**
```json
{
  "amount": "number",
  "requestId": "string (optional, link to booking request)"
}
```
**Response (201):**
```json
{
  "id": "string",
  "tripId": "string",
  "payerId": "string",
  "requestId": "string | null",
  "amount": "number",
  "status": "NOT_STARTED",
  "providerRef": "string | null",
  "createdAt": "ISO DateTime"
}
```
**Errors:** 400, 401, 404

#### GET /payments/:paymentId
**Auth Required:** Yes (must be payer or trip owner)  
**Response (200):** Same as POST response  
**Errors:** 401, 403, 404

---

## Deprecated Endpoints

### POST /trips/:id/book
**Status:** DEPRECATED - Use POST /trips/:tripId/requests instead  
**Will be removed in:** v2.0.0  
**Migration:** Create a BOOKING request, then accept it

---

## Response Headers

All responses include:
- `Content-Type: application/json`
- `X-Request-Id: <uuid>` (for tracing)

## Error Response Format

```json
{
  "statusCode": "number",
  "message": "string | string[]",
  "error": "string (error type)"
}
```

## Backward Compatibility Policy

1. Existing endpoints will not change URLs
2. Existing response fields will not be removed or renamed
3. New optional fields may be added
4. Deprecated endpoints will be marked for at least 6 months before removal
5. Breaking changes will only occur in major versions (v2.0.0, v3.0.0, etc.)
