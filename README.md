# Social Media Site

This project is a simple social media application that allows users to register, log in, create posts, follow/unfollow other users, search for posts and users, and view the latest posts. The application is built using **HTML, CSS, JavaScript, Node.js, MongoDB, jQuery**, and **AJAX**.

## Features

- **User Authentication**: Users can register and log in securely.
- **Create Posts**: Authenticated users can create and share posts.
- **Follow/Unfollow**: Users can follow or unfollow other users.
- **Latest Posts**: See a feed of the most recent posts.
- **Search Functionality**: Search for users or posts using keywords.
- **Single Page System**: Uses jQuery to dynamically load the site based on the URL

## Technologies Used

- **Frontend**:
  - HTML
  - CSS
  - JavaScript
  - jQuery (for AJAX and dynamic interactions)
- **Backend**:
  - Node.js
  - Express.js (for server handling)
- **Database**:
  - MongoDB (for storing users and posts)
- **Tools**:
  - AJAX (for asynchronous requests)
  - npm (Node Package Manager)

## Installation

To set up and run this project locally:

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd social-media-site
   ```

2. **Install Dependencies**
   Ensure you have Node.js and MongoDB installed on your system. Then run:
   ```bash
   npm install
   ```

3. **Set Up MongoDB**
   - Run MongoDB locally or use a MongoDB Atlas cloud database.
   - Update the database connection string in your project (e.g., `config.js` or `.env` file).

4. **Run the Server**
   Start the Node.js server:
   ```bash
   node server.js
   ```
   The server will run on `http://localhost:3000` by default.

5. **View in Browser**
   Open your browser and visit:
   ```
   http://localhost:3000
   ```

## File Structure
```
/social-media-site
│
├── public/                # Static files (HTML, CSS, JS)
│  └──src/
│       ├── css/           # CSS files
│       ├── js/            # Client-side JavaScript
│       └── font/          # Font files
│
├── uploads/               # Images uploaded by the user
├── db.js                  # Database Initialization file
├── server.js              # Main Node.js server file
└── package.json           # npm configuration
```

## API Endpoints
| Method | Endpoint          | Description                                          |
|--------|-------------------|------------------------------------------------------|
| POST   | /users            | Register a new user                                  |
| POST   | /login            | Log in an existing user                              |
| DELETE | /login            | Log out an existing user                             |
| GET    | /login            | Check log in status an current user                  |
| POST   | /contents         | Create a new post                                    |
| GET    | /contents         | Retrieve posts of users followed by current user     |
| GET    | /contents/latest  | Retrieve latest posts                                |
| POST   | /follow           | Follow a user                                        |
| DELETE | /follow           | Unfollow a user                                      |
| GET    | /users/search     | Search for users                                     |
| GET    | /contents/search  | Search for posts                                     |
| POST   | /images           | Upload images                                        |


## Contributing
Contributions are welcome! Please open an issue first to discuss what you would like to change.

## License
This project is licensed under the MIT License.
