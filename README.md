# Tasks App Backend API Hono

This is a backend API for a Tasks application built with Hono, a lightweight and fast web framework for Cloudflare Workers. The API follows RESTful principles and implements many of its key characteristics.

## Features

- Create, read, update, and delete tasks
- Add, read, update, and delete comments for tasks
- API key authentication for secure access
- Rate limiting to prevent abuse
- CORS support for cross-origin requests
- CSRF protection for enhanced security
- Pagination and filtering for task listing
- Error handling and validation using Zod

## Prerequisites

- [Node.js](https://nodejs.org/) (version 20 or higher)
- [Wrangler](https://developers.cloudflare.com/workers/wrangler/) CLI (version 3.50 or higher)
- [Cloudflare Workers](https://workers.cloudflare.com/) account

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/llegomark/tasks-app-backend-api-hono.git
   ```

2. Install the dependencies:
   ```bash
   cd tasks-app-backend
   npm install
   ```

3. Set up the required KV namespaces and API keys in the Cloudflare Workers dashboard.

4. Update the `wrangler.toml` file with your KV namespace IDs and other configuration:
   ```toml
   name = "tasks-app-backend-api-hono"
   compatibility_date = "2024-04-13"
   
   kv_namespaces = [
     { binding = "TASKS", id = "your_tasks_namespace_id" },
     { binding = "COMMENTS", id = "your_comments_namespace_id" },
     { binding = "API_KEYS", id = "your_api_keys_namespace_id" }
   ]
   ```

## Development

To start the development server, run the following command:
```bash
npm run dev
```
This will start the development server using Wrangler. The API will be accessible at `http://localhost:8787`.

## Deployment

To deploy the API to Cloudflare Workers, run the following command:
```bash
npm run deploy
```
This will build and deploy the API to your Cloudflare Workers account using Wrangler.

## API Endpoints

### Tasks

- `POST /api/v1/tasks` - Create a new task
- `GET /api/v1/tasks` - Get a list of tasks (supports pagination and filtering)
- `GET /api/v1/tasks/:id` - Get a specific task
- `PUT /api/v1/tasks/:id` - Update a task
- `DELETE /api/v1/tasks/:id` - Delete a task

### Comments

- `POST /api/v1/tasks/:id/comments` - Add a comment to a task
- `GET /api/v1/tasks/:id/comments` - Get comments for a task
- `PUT /api/v1/tasks/:id/comments/:commentId` - Update a comment
- `DELETE /api/v1/tasks/:id/comments/:commentId` - Delete a comment

## Authentication

To access the API endpoints, you need to include an `X-API-Key` header in your requests with a valid API key. API keys are stored in the `API_KEYS` KV namespace.

## Rate Limiting

The API implements rate limiting to prevent abuse. By default, it allows 100 requests per minute per IP address. You can adjust the rate limiting settings in the `rateLimiter` middleware.

## Error Handling

The API uses custom error handling to provide informative error responses. It also uses Zod for request validation and returns appropriate error messages for invalid requests.

## API Usage Examples with cURL

Here are some examples of how to use the Tasks App Backend API using cURL:

### Create a new task

```bash
curl -X POST -H "Content-Type: application/json" -H "X-API-Key: your_api_key" -d '{
  "title": "Task 1",
  "status": "todo",
  "priority": "high",
  "labels": ["important", "urgent"]
}' https://your-worker-url.workers.dev/api/v1/tasks
```

### Get a list of tasks

```bash
curl -H "X-API-Key: your_api_key" https://your-worker-url.workers.dev/api/v1/tasks
```

### Get a specific task

```bash
curl -H "X-API-Key: your_api_key" https://your-worker-url.workers.dev/api/v1/tasks/task_id
```

### Update a task

```bash
curl -X PUT -H "Content-Type: application/json" -H "X-API-Key: your_api_key" -d '{
  "status": "in-progress"
}' https://your-worker-url.workers.dev/api/v1/tasks/task_id
```

### Delete a task

```bash
curl -X DELETE -H "X-API-Key: your_api_key" https://your-worker-url.workers.dev/api/v1/tasks/task_id
```

### Add a comment to a task

```bash
curl -X POST -H "Content-Type: application/json" -H "X-API-Key: your_api_key" -d '{
  "content": "This is a comment"
}' https://your-worker-url.workers.dev/api/v1/tasks/task_id/comments
```

### Get comments for a task

```bash
curl -H "X-API-Key: your_api_key" https://your-worker-url.workers.dev/api/v1/tasks/task_id/comments
```

### Update a comment

```bash
curl -X PUT -H "Content-Type: application/json" -H "X-API-Key: your_api_key" -d '{
  "content": "Updated comment"
}' https://your-worker-url.workers.dev/api/v1/tasks/task_id/comments/comment_id
```

### Delete a comment

```bash
curl -X DELETE -H "X-API-Key: your_api_key" https://your-worker-url.workers.dev/api/v1/tasks/task_id/comments/comment_id
```

Replace `your_api_key` with your actual API key and `your-worker-url.workers.dev` with your deployed Cloudflare Worker URL.

## Tasks App Backend API Hono Documentation

### Base URL

The base URL for all API endpoints is: `https://your-api-url.com/api/v1`

### Authentication

All API endpoints require authentication using an API key. The API key should be included in the `X-API-Key` header of each request.

### Error Handling

The API uses standard HTTP status codes to indicate the success or failure of a request. The response body will contain an error object with a message property in case of an error.

### Rate Limiting

The API has a rate limit of 100 requests per IP address within a 60-second window. If the limit is exceeded, the API will return a `429 Too Many Requests` status code.

### Endpoints

#### Tasks

##### Create a Task

- Method: `POST`
- Path: `/tasks`
- Request Body:
  ```json
  {
    "title": "string",
    "status": "todo" | "in-progress" | "done",
    "priority": "low" | "medium" | "high",
    "labels": ["string"]
  }
  ```
- Response:
  - Status Code: `201 Created`
  - Body:
    ```json
    {
      "id": "string",
      "title": "string",
      "status": "todo" | "in-progress" | "done",
      "priority": "low" | "medium" | "high",
      "labels": ["string"],
      "createdAt": "number",
      "updatedAt": "number",
      "links": {
        "self": "string",
        "comments": "string"
      }
    }
    ```

##### Get Tasks

- Method: `GET`
- Path: `/tasks`
- Query Parameters:
  - `page`: number (default: 1)
  - `limit`: number (default: 10)
  - `status`: "todo" | "in-progress" | "done"
  - `priority`: "low" | "medium" | "high"
- Response:
  - Status Code: `200 OK`
  - Body:
    ```json
    {
      "tasks": [
        {
          "id": "string",
          "title": "string",
          "status": "todo" | "in-progress" | "done",
          "priority": "low" | "medium" | "high",
          "labels": ["string"],
          "createdAt": "number",
          "updatedAt": "number",
          "links": {
            "self": "string",
            "comments": "string"
          }
        }
      ],
      "metadata": {
        "total": "number",
        "page": "number",
        "limit": "number"
      },
      "links": {
        "self": "string",
        "next": "string",
        "prev": "string"
      }
    }
    ```

##### Get a Task

- Method: `GET`
- Path: `/tasks/:id`
- Response:
  - Status Code: `200 OK`
  - Body:
    ```json
    {
      "id": "string",
      "title": "string",
      "status": "todo" | "in-progress" | "done",
      "priority": "low" | "medium" | "high",
      "labels": ["string"],
      "createdAt": "number",
      "updatedAt": "number",
      "links": {
        "self": "string",
        "comments": "string"
      }
    }
    ```

##### Update a Task

- Method: `PUT`
- Path: `/tasks/:id`
- Request Body:
  ```json
  {
    "title": "string",
    "status": "todo" | "in-progress" | "done",
    "priority": "low" | "medium" | "high",
    "labels": ["string"]
  }
  ```
- Response:
  - Status Code: `200 OK`
  - Body:
    ```json
    {
      "id": "string",
      "title": "string",
      "status": "todo" | "in-progress" | "done",
      "priority": "low" | "medium" | "high",
      "labels": ["string"],
      "createdAt": "number",
      "updatedAt": "number",
      "links": {
        "self": "string",
        "comments": "string"
      }
    }
    ```

##### Delete a Task

- Method: `DELETE`
- Path: `/tasks/:id`
- Response:
  - Status Code: `200 OK`
  - Body:
    ```json
    {
      "message": "Task deleted successfully"
    }
    ```

#### Comments

##### Add a Comment

- Method: `POST`
- Path: `/tasks/:id/comments`
- Request Body:
  ```json
  {
    "content": "string"
  }
  ```
- Response:
  - Status Code: `201 Created`
  - Body:
    ```json
    {
      "id": "string",
      "taskId": "string",
      "content": "string",
      "createdAt": "number",
      "updatedAt": "number",
      "links": {
        "self": "string",
        "task": "string"
      }
    }
    ```

##### Get Comments

- Method: `GET`
- Path: `/tasks/:id/comments`
- Response:
  - Status Code: `200 OK`
  - Body:
    ```json
    {
      "comments": [
        {
          "id": "string",
          "taskId": "string",
          "content": "string",
          "createdAt": "number",
          "updatedAt": "number",
          "links": {
            "self": "string",
            "task": "string"
          }
        }
      ],
      "metadata": {
        "total": "number"
      },
      "links": {
        "self": "string",
        "task": "string"
      }
    }
    ```

##### Update a Comment

- Method: `PUT`
- Path: `/tasks/:id/comments/:commentId`
- Request Body:
  ```json
  {
    "content": "string"
  }
  ```
- Response:
  - Status Code: `200 OK`
  - Body:
    ```json
    {
      "id": "string",
      "taskId": "string",
      "content": "string",
      "createdAt": "number",
      "updatedAt": "number",
      "links": {
        "self": "string",
        "task": "string"
      }
    }
    ```

##### Delete a Comment

- Method: `DELETE`
- Path: `/tasks/:id/comments/:commentId`
- Response:
  - Status Code: `200 OK`
  - Body:
    ```json
    {
      "message": "Comment deleted successfully"
    }
    ```

### Schemas

#### Task Schema

```json
{
  "title": "string",
  "status": "todo" | "in-progress" | "done",
  "priority": "low" | "medium" | "high",
  "labels": ["string"]
}
```

#### Comment Schema

```json
{
  "content": "string"
}
```

### Status Codes

The API uses the following status codes:

- `200 OK` - The request was successful.
- `201 Created` - The resource was successfully created.
- `400 Bad Request` - The request was invalid or cannot be served.
- `401 Unauthorized` - The request requires authentication or the provided API key is invalid.
- `404 Not Found` - The requested resource could not be found.
- `429 Too Many Requests` - The request exceeded the rate limit.
- `500 Internal Server Error` - An unexpected error occurred on the server.

### Validation

The API uses [Zod](https://github.com/colinhacks/zod) for request validation. If a request fails validation, the API will respond with a `400 Bad Request` status code and an error object in the response body.

Example error response:
```json
{
  "error": "Validation failed",
  "issues": [
    {
      "code": "too_small",
      "minimum": 1,
      "type": "string",
      "inclusive": true,
      "path": ["title"],
      "message": "String must contain at least 1 character(s)"
    }
  ]
}
```

### CORS

The API has Cross-Origin Resource Sharing (CORS) enabled for all routes.

### CSRF Protection

The API has Cross-Site Request Forgery (CSRF) protection enabled for all routes under `/api/v1/*`.

### Pagination

The `GET /tasks` endpoint supports pagination using the `page` and `limit` query parameters. The default values are:
- `page`: 1
- `limit`: 10

The response body includes a `metadata` object with the total count of tasks, current page number, and limit. It also includes a `links` object with URLs for the current, next, and previous pages (if applicable).

Example response:
```json
{
  "tasks": [
    {
      "id": "1",
      "title": "Task 1",
      "status": "todo",
      "priority": "high",
      "labels": ["important"],
      "createdAt": 1621500000000,
      "updatedAt": 1621500000000,
      "links": {
        "self": "https://api.example.com/tasks/1",
        "comments": "https://api.example.com/tasks/1/comments"
      }
    }
  ],
  "metadata": {
    "total": 1,
    "page": 1,
    "limit": 10
  },
  "links": {
    "self": "https://api.example.com/tasks?page=1&limit=10",
    "next": null,
    "prev": null
  }
}
```

### Filtering

The `GET /tasks` endpoint supports filtering tasks by `status` and `priority` using query parameters.

Example request:
```
GET /tasks?status=todo&priority=high
```

### Versioning

The API uses URL-based versioning. The current version is `v1`, which is included in the base URL path (`/api/v1`).

## Contributing

Contributions are welcome! If you find any issues or have suggestions for improvement, please open an issue or submit a pull request.

## License

This project is licensed under the [MIT License](LICENSE).