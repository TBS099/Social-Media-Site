//server.mjs
import express from 'express';
import { ObjectId } from 'mongodb';
import connectDatabase from './db.js';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from "url";
import bodyParser from 'body-parser';
import expressSession from 'express-session';

//Define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const app = express();
const port = process.env.PORT || 5000; //Using port 5000
const STUDENT_ID = 'YOUR-ID'; //Student ID, just for requirement, use home if needed

//Middleware to parse JSON bodies
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//Session middleware configuration
app.use(
    expressSession({
        secret: 'Social-MySecret',
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true, //Protect against XSS by not allowing JavaScript access to cookies
            secure: false, //Set to true if using HTTPS
        },
    })
);

//Redirect from the root URL to ID
app.get('/', (req, res) => {
    res.redirect(`/${STUDENT_ID}/`);
});

//Middleware to serve static files from the 'public' directory under ID
app.use(`/${STUDENT_ID}`, express.static('public'));

//Connect to the database when the server starts
connectDatabase().then((db) => {
    const posts = db.collection('posts');
    const users = db.collection('users');
    const images = db.collection('images');

    //POST route to register a new user
    app.post(`/${STUDENT_ID}/users`, async (req, res) => {
        const { username, email, password } = req.body;

        try {
            //Check if username exists
            const [user, email_check] = await Promise.all([
                users.findOne({ username }),
                users.findOne({ email })
            ]);
            if (user) {
                return res.status(400).json({ error: 'Username already exists' });
            }

            if (email_check) {
                return res.status(400).json({ error: "Email already exists" });
            }

            //Hash the password before storing it (using SHA-256 and salt)
            const salt = crypto.randomBytes(16).toString('hex'); //Generate a salt
            const hashedPassword = crypto.createHmac('sha256', salt)
                .update(password)
                .digest('hex'); //Hash the password with the salt

            //Insert the new user
            const result = await users.insertOne({
                username,
                email,
                password: hashedPassword,
                salt: salt,
                following: [],
                followers: [],
                created: new Date()
            });

            req.session.user_logged_in = true; //Indicates the user is logged in
            req.session.user_id = result.insertedId;

            //Respond with success message
            res.status(201).json({
                message: 'User registered successfully',
                id: result.insertedId.toString()
            });
        }
        catch (error) {
            console.error("Error registering user:", error);
            res.status(500).json({ error: "Failed to register user" });
        }
    });

    //GET route to check login status of a user
    app.get(`/${STUDENT_ID}/login`, async (req, res) => {
        try {
            //Check if the user is logged in by checking session data or a token
            const user_logged_in = req.session?.user_id;

            if (user_logged_in) {
                const current_user = await users.findOne({ _id: new ObjectId(user_logged_in) });

                //Return logged-in status as true and user info
                res.status(200).json({
                    logged_in: true,
                    user_id: user_logged_in,
                    following: current_user.following
                });
            } else {
                //Return logged-in status as false if not logged in
                res.status(200).json({
                    logged_in: false
                });
            }
        }
        catch (error) {
            console.error("Error checking login status:", error);
            res.status(500).json({ error: "Failed to check login status" });
        }
    });

    //POST route to login a user
    app.post(`/${STUDENT_ID}/login`, async (req, res) => {
        const { username, password } = req.body;

        try {
            //Check if user exists
            const user = await users.findOne({ username });
            if (!user) {
                return res.status(404).json('User not found');
            }

            //Hash the provided password with the stored salt
            const hashedPassword = crypto.createHmac('sha256', user.salt)
                .update(password)
                .digest('hex');

            //Compare the hashed passwords
            if (hashedPassword !== user.password) {
                return res.status(401).json('Incorrect password');
            }


            req.session.user_logged_in = true; //Indicates the user is logged in
            req.session.user_id = user._id;

            //Send success response with user ID and logged-in status
            res.status(200).json({
                message: "Login successful",
                userId: user._id.toString(),
                loggedIn: true,
            });
        }
        catch (error) {
            console.error("Error logging in user:", error);
            res.status(500).json({ error: "Failed to log in user" });
        }
    });

    //DELETE route to logout a user
    app.delete(`/${STUDENT_ID}/login`, async (req, res) => {
        try {
            //Check if the user is logged in
            if (req.session?.user_logged_in) {
                //Delete the session data
                req.session.destroy((err) => {
                    if (err) {
                        console.error("Error destroying session:", err);
                        return res.status(500).json({ error: "Failed to log out user" });
                    }
                    //Respond with a logout confirmation
                    res.status(200).json({ message: 'Logged out successfully' });
                });
            } else {
                //If no active session, respond with an error message
                res.status(400).json({ message: 'No active session found' });
            }
        }
        catch (error) {
            console.error("Error logging out user:", error);
            res.status(500).json({ error: "Failed to log out user" });
        }
    });

    //POST route to create new posts and store them
    app.post(`/${STUDENT_ID}/contents`, async (req, res) => {
        const { content, tags } = req.body;
        const author_id = req.session?.user_id;

        //Extract the tags from the comma-separated string
        const tags_array = tags.split(',').map(tag => tag.trim()).filter(tag => tag !== "" && tag.startsWith('#'));

        //Check if the array is empty, and if so, set it to an empty array
        if (tags_array.length === 0) {
            tags_array = [];
        }

        try {
            //Insert the post
            const result = await posts.insertOne({
                content,
                author_id: new ObjectId(author_id),
                tags: tags_array,
                date: new Date()
            });

            //Respond with success message
            res.status(201).json({
                message: 'Post created successfully',
                id: result.insertedId.toString()
            });
        }
        catch (error) {
            console.error("Error creating post:", error);
            res.status(500).json({ error: "Failed to create post" });
        }
    });

    //GET route to retrieve posts
    app.get(`/${STUDENT_ID}/contents`, async (req, res) => {
        try {
            const user_id = req.session?.user_id;
            let post_data = [];

            if (!user_id) {
                return res.status(401).json({ error: "Not logged in" });
            }

            const user = await users.findOne({ _id: new ObjectId(user_id) });
            if (!user) {
                return res.status(404).json({ error: "User not found" });
            }

            const following = user.following || [];

            if (following.length > 0) {
                post_data = await posts.aggregate([
                    {
                        $match: { author_id: { $in: following } } // Match posts where the author is in the 'following' array
                    },
                    {
                        $lookup: {
                            from: 'users', // Specify the collection to join
                            localField: 'author_id', // Field from the 'posts' collection
                            foreignField: '_id', // Field from the 'users' collection
                            as: 'author' // Alias for the joined data
                        }
                    },
                    {
                        $unwind: '$author' // Unwind the 'author' array (since $lookup returns an array)
                    },
                    {
                        $project: {
                            content: 1, // Include content in the output
                            author_id: 1, // Include author_id in the output
                            tags: 1, // Include tags in the output
                            date: 1, // Include the date in the output
                            author_name: '$author.username', // Add author name to the result
                        }
                    },
                    {
                        $sort: { date: -1 } // Sort by date in descending order
                    }
                ]).toArray();
            }

            res.status(200).json(post_data);
        } catch (error) {
            console.error("Error fetching posts:", error);
            res.status(500).json({ error: "Failed to fetch posts" });
        }
    });

    //GET route to retrieve latest posts from all users
    app.get(`/${STUDENT_ID}/contents/latest`, async (req, res) => {
        try {
            console.log("Fetching latest posts");
            //Find all posts, sorted by creation date (latest first)
            const post_data = await posts.aggregate([
                {
                    $lookup: {
                        from: 'users', // The users collection to join
                        localField: 'author_id', // Field in the 'posts' collection
                        foreignField: '_id', // Field in the 'users' collection
                        as: 'author' // Alias for the joined data
                    }
                },
                {
                    $unwind: '$author' // Flatten the 'author' array to make the fields directly accessible
                },
                {
                    $project: {
                        content: 1, // Include content in the output
                        author_id: { $toString: '$author_id' }, // Include author_id in the output
                        tags: 1, // Include tags in the output
                        date: 1, // Include the date in the output
                        author_name: '$author.username', // Add author name (replace 'username' with the actual field)
                    }
                },
                {
                    $sort: { date: -1 } // Sort posts by date, most recent first
                }
            ]).toArray();
            console.log(post_data);
            //Respond with the posts in JSON format
            res.status(200).json(post_data);
        } catch (error) {
            console.error("Error fetching posts:", error);
            res.status(500).json({ error: "Failed to fetch posts" });
        }
    });

    //POST route to follow a user
    app.post(`/${STUDENT_ID}/follow`, async (req, res) => {
        const { user_following } = req.body;
        const user_id = req.session?.user_id;

        try {
            // Check if user_following and user_id are valid ObjectId strings
            if (!ObjectId.isValid(user_following) || !ObjectId.isValid(user_id)) {
                return res.status(400).json({ error: 'Invalid user ID' });
            }

            // Proceed with the rest of the code
            const following_user = await users.findOne({ _id: new ObjectId(user_following) });
            if (!following_user) {
                return res.status(404).json({ error: "User not found" });
            }

            const logged_in_user = await users.findOne({ _id: new ObjectId(user_id) });

            // Check if the logged-in user is already following this user
            if (logged_in_user.following.includes(following_user._id)) {
                return res.status(400).json({ error: "Already following user" });
            }

            // Add the user to the following list
            await users.updateOne(
                { _id: new ObjectId(user_id) },
                { $push: { following: following_user._id } }
            );

            // Add the logged-in user to the followers list of the user being followed
            await users.updateOne(
                { _id: following_user._id },
                { $push: { followers: new ObjectId(user_id) } }
            );

            res.status(200).json({
                message: `You are now following ${following_user.username}`,
                following: following_user.username,
                followersUpdated: true
            });
        } catch (error) {
            console.error("Error following user:", error);
            res.status(500).json({ error: "Failed to follow user" });
        }
    });

    //DELETE route to unfollow a user
    app.delete(`/${STUDENT_ID}/follow`, async (req, res) => {
        const { user_unfollowing } = req.body; // The user to unfollow
        const user_id = req.session?.user_id; // Logged-in user's ID

        try {
            // Check if the user is logged in
            if (!user_id) {
                return res.status(401).json({ error: 'Not logged in' });
            }

            // Validate user_unfollowing and user_id to ensure they are valid ObjectId values
            if (!ObjectId.isValid(user_unfollowing)) {
                return res.status(400).json({ error: 'Invalid user ID' });
            }

            // Find the user to unfollow
            const unfollowing_user = await users.findOne({ _id: new ObjectId(user_unfollowing) });
            if (!unfollowing_user) {
                return res.status(404).json({ error: "User not found" });
            }

            const logged_in_user = await users.findOne({ _id: new ObjectId(user_id) });

            // Check if the logged-in user is following this user
            if (!logged_in_user.following.some(id => id.toString() === unfollowing_user._id.toString())) {
                return res.status(400).json({ error: "Not following this user" });
            }


            // Remove the user from the following list of the logged-in user
            await users.updateOne(
                { _id: new ObjectId(user_id) },
                { $pull: { following: unfollowing_user._id } }
            );

            // Remove the logged-in user from the followers list of the user being unfollowed
            await users.updateOne(
                { _id: unfollowing_user._id },
                { $pull: { followers: new ObjectId(user_id) } }
            );

            // Respond with a success message
            res.status(200).json({
                message: `You are no longer following ${unfollowing_user.username}`, // Display the unfollowed user's username
                following: unfollowing_user.username,
                followersUpdated: true
            });
        }
        catch (error) {
            console.error("Error unfollowing user:", error);
            res.status(500).json({ error: "Failed to unfollow user" });
        }
    });


    //GET route to search for a user
    app.get(`/${STUDENT_ID}/users/search`, async (req, res) => {
        try {
            const query = req.query.q; //Extract the search query from URL parameters

            if (!query) {
                return res.status(400).json({ error: "Search query not provided" });
            }

            //Search users with a case-insensitive regex match
            const usersMatchingQuery = await users
                .find({ username: { $regex: query, $options: "i" } }) //"i" for case-insensitive
                .project({ username: 1, email: 1 }) //Limit fields to return (e.g., username and email)
                .toArray();

            //Respond with the matching users
            res.status(200).json(usersMatchingQuery);
        } catch (error) {
            console.error("Error searching for users:", error);
            res.status(500).json({ error: "Failed to search for users" });
        }
    });

    //GET route to search for posts
    app.get(`/${STUDENT_ID}/contents/search`, async (req, res) => {
        try {
            const query = req.query.q; //Extract the search query from URL parameters

            if (!query) {
                return res.status(400).json({ error: "Search query not provided" });
            }

            //Perform a case-insensitive search in both `content` and `tags`
            const postsMatchingQuery = await posts
                .find({
                    $or: [
                        { content: { $regex: query, $options: "i" } }, //Match in content
                        { tags: { $regex: query, $options: "i" } }     //Match in tags
                    ]
                })
                .toArray();

            //Respond with the matching posts
            res.status(200).json(postsMatchingQuery);
        } catch (error) {
            console.error("Error searching for contents:", error);
            res.status(500).json({ error: "Failed to search for contents" });
        }
    });

    //Catch-all route to serve the same HTML file for dynamic routes
    app.get(`/${STUDENT_ID}/*`, (req, res) => {
        //Only serve index.html for requests that don't match the API routes
        res.sendFile(path.join(__dirname, "public", "index.html"));
    });

}).catch((error) => {
    console.error('Error connecting to MongoDB:', error);
});

//Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}/${STUDENT_ID}/`);
});
