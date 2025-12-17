# Redstone API Documentation

Base URL: `http://localhost:3000/api` (development)

## Authentication

All endpoints except `/auth/login` and `/auth/register` require authentication.

### Web Authentication (NextAuth.js)
- Uses HTTP-only cookies
- Automatically handled by NextAuth

### Mobile Authentication (JWT)
Include the JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## Auth Endpoints

### POST /auth/register
Register a new user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe" // optional
}
```

**Response (201):**
```json
{
  "user": {
    "id": "...",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

### POST /auth/login
Login and get JWT token (for mobile).

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "...",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

---

## File Endpoints

### GET /files
List all files for the authenticated user.

**Query Parameters:**
- `page` (optional, default: 1) - Page number
- `limit` (optional, default: 50) - Items per page
- `folderId` (optional) - Filter by folder
- `search` (optional) - Search in title and content

**Response (200):**
```json
{
  "files": [
    {
      "id": "...",
      "title": "My Note",
      "content": "# Hello\n\nThis is my note.",
      "folderId": "...",
      "userId": "...",
      "createdAt": "2025-12-17T...",
      "updatedAt": "2025-12-17T...",
      "deletedAt": null,
      "lastSynced": "2025-12-17T...",
      "folder": {
        "id": "...",
        "name": "My Folder"
      },
      "tags": [
        {
          "fileId": "...",
          "tagId": "...",
          "tag": {
            "id": "...",
            "name": "important"
          }
        }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 5,
    "totalPages": 1
  }
}
```

### POST /files
Create a new file.

**Request Body:**
```json
{
  "title": "My New Note",
  "content": "# Hello World",
  "folderId": "..." // optional
}
```

**Response (201):**
```json
{
  "file": {
    "id": "...",
    "title": "My New Note",
    "content": "# Hello World",
    "folderId": "...",
    "userId": "...",
    "createdAt": "2025-12-17T...",
    "updatedAt": "2025-12-17T...",
    "folder": { ... }
  }
}
```

### GET /files/:id
Get a specific file.

**Response (200):**
```json
{
  "file": {
    "id": "...",
    "title": "My Note",
    "content": "...",
    "folder": { ... },
    "tags": [ ... ]
  }
}
```

### PUT /files/:id
Update a file. Creates a version if content changes.

**Request Body:**
```json
{
  "title": "Updated Title", // optional
  "content": "Updated content", // optional
  "folderId": "..." // optional (null to move to root)
}
```

**Response (200):**
```json
{
  "file": { ... }
}
```

### DELETE /files/:id
Soft delete a file.

**Response (200):**
```json
{
  "message": "File deleted successfully"
}
```

### GET /files/:id/versions
Get file version history.

**Response (200):**
```json
{
  "versions": [
    {
      "id": "...",
      "fileId": "...",
      "content": "Previous content...",
      "createdAt": "2025-12-17T..."
    }
  ]
}
```

---

## Folder Endpoints

### GET /folders
List all folders in tree structure.

**Response (200):**
```json
{
  "folders": [
    {
      "id": "...",
      "name": "My Folder",
      "parentId": null,
      "userId": "...",
      "createdAt": "...",
      "updatedAt": "...",
      "_count": {
        "files": 5,
        "children": 2
      },
      "children": [ ... ]
    }
  ]
}
```

### POST /folders
Create a new folder.

**Request Body:**
```json
{
  "name": "New Folder",
  "parentId": "..." // optional (null for root folder)
}
```

**Response (201):**
```json
{
  "folder": {
    "id": "...",
    "name": "New Folder",
    "parentId": "...",
    "_count": { ... }
  }
}
```

### GET /folders/:id
Get a specific folder with its children and files.

**Response (200):**
```json
{
  "folder": {
    "id": "...",
    "name": "My Folder",
    "children": [ ... ],
    "files": [ ... ],
    "_count": { ... }
  }
}
```

### PUT /folders/:id
Update a folder (rename or move).

**Request Body:**
```json
{
  "name": "Renamed Folder", // optional
  "parentId": "..." // optional (null to move to root)
}
```

**Response (200):**
```json
{
  "folder": { ... }
}
```

### DELETE /folders/:id
Delete an empty folder.

**Response (200):**
```json
{
  "message": "Folder deleted successfully"
}
```

**Error (400) if not empty:**
```json
{
  "error": "Cannot delete non-empty folder. Please move or delete its contents first."
}
```

---

## Tag Endpoints

### GET /tags
List all tags for the authenticated user.

**Response (200):**
```json
{
  "tags": [
    {
      "id": "...",
      "name": "important",
      "userId": "...",
      "createdAt": "...",
      "_count": {
        "files": 3
      }
    }
  ]
}
```

### POST /files/:id/tags
Add a tag to a file (creates tag if it doesn't exist).

**Request Body:**
```json
{
  "tagName": "important"
}
```

**Response (201):**
```json
{
  "tag": {
    "id": "...",
    "name": "important",
    "userId": "..."
  }
}
```

### DELETE /files/:id/tags/:tagId
Remove a tag from a file.

**Response (200):**
```json
{
  "message": "Tag removed from file"
}
```

---

## Search & Sync Endpoints

### GET /search
Search files by title or content.

**Query Parameters:**
- `q` (required) - Search query

**Response (200):**
```json
{
  "files": [ ... ],
  "query": "search term"
}
```

### GET /sync
Sync endpoint for mobile - get changes since a timestamp.

**Query Parameters:**
- `since` (required) - ISO timestamp (e.g., "2025-12-17T15:00:00.000Z")

**Response (200):**
```json
{
  "files": {
    "upserted": [ ... ], // Created or updated files
    "deleted": ["id1", "id2"] // Deleted file IDs
  },
  "folders": {
    "upserted": [ ... ],
    "deleted": ["id1"]
  },
  "syncedAt": "2025-12-17T16:00:00.000Z"
}
```

---

## Error Responses

All endpoints may return these error codes:

- **401 Unauthorized**: Missing or invalid authentication
  ```json
  { "error": "Unauthorized" }
  ```

- **404 Not Found**: Resource not found
  ```json
  { "error": "File not found" }
  ```

- **400 Bad Request**: Invalid input
  ```json
  { "error": "Title is required" }
  ```

- **500 Internal Server Error**: Server error
  ```json
  { "error": "Internal server error" }
  ```

---

## Testing the API

### Using the seed data:
- **Email**: `test@redstone.app`
- **Password**: `password123`

### Example with curl:

1. Login:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@redstone.app","password":"password123"}'
```

2. Use the token:
```bash
TOKEN="your-token-here"
curl -X GET http://localhost:3000/api/files \
  -H "Authorization: Bearer $TOKEN"
```
