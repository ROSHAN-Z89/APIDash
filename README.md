# APIDash — REST API Tester

APIDash is a lightweight, browser-based REST API testing application built using HTML, CSS, and JavaScript. It provides a clean and efficient interface for sending HTTP requests, analyzing responses, and debugging APIs without relying on external tools or installations.

---

## Overview

APIDash is designed to streamline API development and testing workflows. It offers a structured interface for constructing requests, managing headers and parameters, handling authentication, and viewing responses in multiple formats.

---

## Features

### HTTP Request Support
- Supports standard HTTP methods: GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS
- Real-time request execution using the Fetch API

### Request Configuration
- Dynamic query parameter management
- Custom header configuration
- Automatic URL synchronization with query parameters

### Request Body Handling
- Supports multiple body types:
  - JSON
  - Plain Text
  - Form URL Encoded
- JSON formatting and validation support

### Authentication
- Bearer Token authentication
- Basic Authentication (Base64 encoded)
- API Key support with custom header injection

### Response Visualization
- Pretty view with syntax-highlighted JSON
- Raw response viewer
- Structured response headers display
- Line-numbered formatting for readability

### Metadata Insights
- HTTP status code with visual indicators
- Response time measurement
- Response size calculation

### History Management
- Tracks recent API requests (up to 30 entries)
- Quick reload of previous requests
- Option to clear request history

### Utility Features
- Copy response to clipboard
- Toast notifications for actions and errors
- Predefined API request examples
- Resizable panel layout for better workspace control

---

## Project Structure
APIDash/
│
├── index.html # Main UI structure
├── style.css # Styling and layout (dark theme)
└── app.js # Core application logic



---

## Installation and Usage

1. Clone or download the repository:
   ```bash
   git clone [<repository-url>](https://github.com/ROSHAN-Z89/APIDash)
   cd APIDash
