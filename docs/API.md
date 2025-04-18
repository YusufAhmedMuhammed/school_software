# School Management System API Documentation

## Authentication

### Login
- **Endpoint**: `/auth/login`
- **Method**: POST
- **Description**: Authenticate user and get JWT token
- **Request Body**:
  ```json
  {
    "email": "string",
    "password": "string"
  }
  ```
- **Response**:
  ```json
  {
    "access_token": "string",
    "token_type": "bearer"
  }
  ```

### Get Current User
- **Endpoint**: `/auth/me`
- **Method**: GET
- **Description**: Get current authenticated user details
- **Headers**: `Authorization: Bearer <token>`
- **Response**:
  ```json
  {
    "id": "string",
    "email": "string",
    "role": "string",
    "fullname": "string"
  }
  ```

## Courses

### Get Teacher's Courses
- **Endpoint**: `/courses/teacher`
- **Method**: GET
- **Description**: Get all courses taught by the current teacher
- **Headers**: `Authorization: Bearer <token>`
- **Response**:
  ```json
  [
    {
      "_id": "string",
      "title": "string",
      "description": "string",
      "teacher_id": "string"
    }
  ]
  ```

## Attendance

### Get Course Attendance
- **Endpoint**: `/attendance/{course_id}`
- **Method**: GET
- **Description**: Get attendance records for a specific course and date
- **Headers**: `Authorization: Bearer <token>`
- **Query Parameters**:
  - `date`: string (YYYY-MM-DD)
- **Response**:
  ```json
  [
    {
      "student_id": "string",
      "student_name": "string",
      "status": "string",
      "date": "string"
    }
  ]
  ```

### Update Student Attendance
- **Endpoint**: `/attendance/{course_id}/student/{student_id}`
- **Method**: POST
- **Description**: Update attendance status for a specific student
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "status": "string",
    "date": "string"
  }
  ```

### Bulk Update Attendance
- **Endpoint**: `/attendance/{course_id}/bulk`
- **Method**: POST
- **Description**: Update attendance status for multiple students
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "students": ["string"],
    "status": "string",
    "date": "string"
  }
  ```

## Error Responses

All endpoints may return the following error responses:

- **401 Unauthorized**
  ```json
  {
    "detail": "Not authenticated"
  }
  ```

- **403 Forbidden**
  ```json
  {
    "detail": "Not authorized"
  }
  ```

- **404 Not Found**
  ```json
  {
    "detail": "Resource not found"
  }
  ```

- **422 Unprocessable Entity**
  ```json
  {
    "detail": "Validation error",
    "errors": {
      "field": ["error message"]
    }
  }
  ``` 