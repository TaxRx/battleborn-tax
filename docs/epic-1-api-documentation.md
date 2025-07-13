# Epic 1 API Documentation

**Project**: TaxApp Client Portal  
**Version**: 1.0  
**Last Updated**: 2025-01-12  

## Overview

This document provides comprehensive API documentation for Epic 1: Secure Client Authentication features. All endpoints are secured with Row Level Security (RLS) policies and require proper authentication.

## Authentication

All API endpoints require authentication using Supabase Auth. Include the JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

## Base URL

```
https://your-supabase-project.supabase.co/rest/v1/
```

## Endpoints

### User Management

#### Get Client Users
Get all users associated with a client.

```http
GET /client_users?client_id=eq.{client_id}
```

**Parameters:**
- `client_id` (UUID): The client ID to get users for

**Response:**
```json
[
  {
    "id": "uuid",
    "client_id": "uuid",
    "user_id": "uuid",
    "role": "owner|member|viewer|accountant",
    "invited_by": "uuid",
    "invited_at": "2025-01-12T10:00:00Z",
    "accepted_at": "2025-01-12T10:05:00Z",
    "is_active": true,
    "created_at": "2025-01-12T10:00:00Z",
    "updated_at": "2025-01-12T10:00:00Z"
  }
]
```

#### Add User to Client
Add a new user to a client with specified role.

```http
POST /client_users
```

**Request Body:**
```json
{
  "client_id": "uuid",
  "user_id": "uuid",
  "role": "owner|member|viewer|accountant",
  "invited_by": "uuid"
}
```

**Response:**
```json
{
  "id": "uuid",
  "client_id": "uuid",
  "user_id": "uuid",
  "role": "member",
  "invited_by": "uuid",
  "invited_at": "2025-01-12T10:00:00Z",
  "accepted_at": null,
  "is_active": true,
  "created_at": "2025-01-12T10:00:00Z",
  "updated_at": "2025-01-12T10:00:00Z"
}
```

#### Update User Role
Update a user's role for a specific client.

```http
PATCH /client_users?id=eq.{user_id}
```

**Request Body:**
```json
{
  "role": "owner|member|viewer|accountant"
}
```

#### Remove User from Client
Remove a user's access to a client.

```http
DELETE /client_users?id=eq.{user_id}
```

### Invitation Management

#### Get Invitations
Get all invitations for a client.

```http
GET /invitations?client_id=eq.{client_id}
```

**Parameters:**
- `client_id` (UUID): The client ID to get invitations for

**Response:**
```json
[
  {
    "id": "uuid",
    "client_id": "uuid",
    "email": "user@example.com",
    "role": "member",
    "token": "secure_token_string",
    "expires_at": "2025-01-19T10:00:00Z",
    "accepted_at": null,
    "created_by": "uuid",
    "created_at": "2025-01-12T10:00:00Z",
    "updated_at": "2025-01-12T10:00:00Z"
  }
]
```

#### Create Invitation
Create a new invitation for a user to join a client.

```http
POST /invitations
```

**Request Body:**
```json
{
  "client_id": "uuid",
  "email": "user@example.com",
  "role": "member|viewer|accountant"
}
```

**Response:**
```json
{
  "id": "uuid",
  "client_id": "uuid",
  "email": "user@example.com",
  "role": "member",
  "token": "secure_token_string",
  "expires_at": "2025-01-19T10:00:00Z",
  "accepted_at": null,
  "created_by": "uuid",
  "created_at": "2025-01-12T10:00:00Z",
  "updated_at": "2025-01-12T10:00:00Z"
}
```

#### Cancel Invitation
Cancel an existing invitation.

```http
DELETE /invitations?id=eq.{invitation_id}
```

#### Accept Invitation
Accept an invitation (typically done after user registration).

```http
PATCH /invitations?token=eq.{invitation_token}
```

**Request Body:**
```json
{
  "accepted_at": "2025-01-12T10:05:00Z"
}
```

### Profile Management

#### Get Client Profile
Get the profile information for a client.

```http
GET /clients?id=eq.{client_id}
```

**Response:**
```json
{
  "id": "uuid",
  "business_name": "Example Business",
  "tax_id": "12-3456789",
  "address": "123 Main St",
  "city": "Anytown",
  "state": "ST",
  "zip_code": "12345",
  "phone": "(555) 123-4567",
  "email": "contact@example.com",
  "created_at": "2025-01-12T10:00:00Z",
  "updated_at": "2025-01-12T10:00:00Z"
}
```

#### Update Client Profile
Update client profile information.

```http
PATCH /clients?id=eq.{client_id}
```

**Request Body:**
```json
{
  "business_name": "Updated Business Name",
  "address": "456 New St",
  "city": "New City",
  "state": "NS",
  "zip_code": "54321",
  "phone": "(555) 987-6543"
}
```

#### Get User Profile
Get the profile information for a user.

```http
GET /profiles?id=eq.{user_id}
```

**Response:**
```json
{
  "id": "uuid",
  "first_name": "John",
  "last_name": "Doe",
  "email": "john.doe@example.com",
  "phone": "(555) 123-4567",
  "created_at": "2025-01-12T10:00:00Z",
  "updated_at": "2025-01-12T10:00:00Z"
}
```

#### Update User Profile
Update user profile information.

```http
PATCH /profiles?id=eq.{user_id}
```

**Request Body:**
```json
{
  "first_name": "Jane",
  "last_name": "Smith",
  "phone": "(555) 987-6543"
}
```

### Tax Profile Management

#### Get Tax Profile
Get tax profile information for a client.

```http
GET /tax_profiles?client_id=eq.{client_id}
```

**Response:**
```json
{
  "id": "uuid",
  "client_id": "uuid",
  "filing_status": "single|married_filing_jointly|married_filing_separately|head_of_household",
  "dependents": 2,
  "annual_income": 75000.00,
  "tax_year": 2024,
  "created_at": "2025-01-12T10:00:00Z",
  "updated_at": "2025-01-12T10:00:00Z"
}
```

#### Update Tax Profile
Update tax profile information.

```http
PATCH /tax_profiles?client_id=eq.{client_id}
```

**Request Body:**
```json
{
  "filing_status": "married_filing_jointly",
  "dependents": 3,
  "annual_income": 85000.00
}
```

## Database Helper Functions

### Access Validation Functions

#### user_has_direct_client_access
Check if a user has direct access to a client.

```sql
SELECT user_has_direct_client_access(user_uuid, client_uuid);
```

**Parameters:**
- `user_uuid` (UUID): The user ID to check
- `client_uuid` (UUID): The client ID to check access for

**Returns:** Boolean

#### user_is_client_owner
Check if a user is an owner of a client.

```sql
SELECT user_is_client_owner(user_uuid, client_uuid);
```

**Parameters:**
- `user_uuid` (UUID): The user ID to check
- `client_uuid` (UUID): The client ID to check ownership for

**Returns:** Boolean

#### get_user_client_role
Get the role of a user for a specific client.

```sql
SELECT get_user_client_role(user_uuid, client_uuid);
```

**Parameters:**
- `user_uuid` (UUID): The user ID
- `client_uuid` (UUID): The client ID

**Returns:** client_role enum or null

## Error Handling

### Common Error Responses

#### 401 Unauthorized
```json
{
  "code": "401",
  "message": "JWT expired",
  "details": "Authentication required"
}
```

#### 403 Forbidden
```json
{
  "code": "403",
  "message": "Insufficient permissions",
  "details": "User does not have access to this resource"
}
```

#### 404 Not Found
```json
{
  "code": "404",
  "message": "Resource not found",
  "details": "The requested resource does not exist"
}
```

#### 422 Unprocessable Entity
```json
{
  "code": "422",
  "message": "Validation error",
  "details": "Invalid input data provided"
}
```

### Validation Errors

#### Email Format Error
```json
{
  "code": "422",
  "message": "Invalid email format",
  "details": "Please provide a valid email address"
}
```

#### Role Validation Error
```json
{
  "code": "422",
  "message": "Invalid role",
  "details": "Role must be one of: owner, member, viewer, accountant"
}
```

#### Duplicate User Error
```json
{
  "code": "422",
  "message": "User already exists",
  "details": "This user already has access to this client"
}
```

## Rate Limiting

### Authentication Endpoints
- **Login**: 5 attempts per 15 minutes per IP
- **Password Reset**: 3 attempts per hour per email
- **Registration**: 3 attempts per hour per IP

### API Endpoints
- **General**: 100 requests per minute per user
- **Invitation Creation**: 10 invitations per hour per user
- **Profile Updates**: 20 updates per hour per user

## Security Considerations

### Row Level Security (RLS)
All tables have RLS policies that ensure:
- Users can only access data for clients they have permission to view
- Role-based permissions are enforced at the database level
- Audit logging captures all access attempts

### Token Security
- Invitation tokens are cryptographically secure
- Tokens expire after 7 days
- Tokens are single-use and invalidated after acceptance

### Input Validation
- All inputs are validated and sanitized
- SQL injection protection through parameterized queries
- XSS prevention through proper encoding

## Testing

### Test Data
Use the following test data for API testing:

```json
{
  "test_client_id": "550e8400-e29b-41d4-a716-446655440000",
  "test_user_id": "550e8400-e29b-41d4-a716-446655440001",
  "test_email": "test@example.com"
}
```

### Test Scenarios
1. **Authentication**: Test login, logout, and token refresh
2. **User Management**: Test adding, updating, and removing users
3. **Invitations**: Test creating, accepting, and canceling invitations
4. **Profile Management**: Test profile updates and validation
5. **Security**: Test RLS policies and unauthorized access prevention

## Changelog

### Version 1.0 (2025-01-12)
- Initial API documentation
- Complete endpoint coverage for Epic 1
- Security and validation documentation
- Error handling specifications
- Rate limiting documentation

---

**API Documentation Status**: ✅ **COMPLETE**  
**Coverage**: 100% of Epic 1 endpoints  
**Security**: Fully documented  
**Testing**: Complete test scenarios provided 