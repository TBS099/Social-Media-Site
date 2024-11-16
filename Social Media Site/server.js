//server.mjs
import express from 'express';
import connectDatabase from './db.js';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const app = express();
const port = process.env.PORT || 5000; //Using port 5000
const STUDENT_ID = 'YOUR-ID'; //Student ID, just for requirement, use home if needed

//Middleware to parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
            const user = await users.findOne({ username });
            if (user) {
                return res.status(400).send('Username already exists');
            }

            // Hash the password before storing it (using SHA-256 and salt)
            const salt = crypto.randomBytes(16).toString('hex'); // Generate a salt
            const hashedPassword = crypto.createHmac('sha256', salt)
                .update(password)
                .digest('hex'); // Hash the password with the salt

            //Insert the new user
            const result = await users.insertOne({
                username,
                email,
                password: hashedPassword,
                salt: salt,
                following: [],
                created: new Date()
            });

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
            // Check if the user is logged in by checking session data or a token
            const user_logged_in = req.session?.user_logged_in;

            if (user_logged_in) {
                //Return logged-in status as true and user info
                res.status(200).json({
                    loggedIn: true,
                    userId: user_logged_in
                });
            } else {
                //Return logged-in status as false if not logged in
                res.status(200).json({
                    loggedIn: false
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
                return res.status(404).send('User not found');
            }

            //Hash the provided password with the stored salt
            const hashedPassword = crypto.createHmac('sha256', user.salt)
                .update(password)
                .digest('hex');

            //Compare the hashed passwords
            if (hashedPassword !== user.password) {
                return res.status(401).json({ error: 'Incorrect password' });
            }


            //Log the user in
            req.session.loggedInUser = user._id;

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
                delete req.session.user_logged_in;

                //Respond with a logout confirmation
                res.status(200).json({ message: 'Logged out successfully' });
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

    //POST route to handle image uploads
    app.post(`/${STUDENT_ID}/images`, async (req, res) => {
        const { post_id } = req.body;
        const image = req.files?.image;

        if (!image) {
            return res.status(400).json({ error: 'No image uploaded' });
        }

        try {
            //Save image to the server (as a file or directly in DB)
            const imagePath = path.join(__dirname, 'uploads', image.name);
            fs.writeFileSync(imagePath, image.data);

            const result = await images.insertOne({
                file_name: image.name,
                path: imagePath,
                date: new Date()
            });

            //Get the image ID from the inserted image document
            const imageId = result.insertedId;

            //Update the post with the image ID
            const posts = db.collection('posts');
            await posts.updateOne(
                { _id: post_id },
                { $set: { image_id: imageId } }
            );

            res.status(201).json({
                message: 'Image uploaded and associated with post successfully',
                image_id: imageId.toString()
            });
        } catch (error) {
            console.error("Error uploading image:", error);
            res.status(500).json({ error: "Failed to upload image" });
        }
    });

    //POST route to create new posts and store them
    app.post(`/${STUDENT_ID}/contents`, async (req, res) => {
        const { content, author_id, tags } = req.body;
        let postId = null;

        try {
            //Insert the post
            const result = await posts.insertOne({
                content,
                author_id,
                tags,
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
            const user_id = req.session?.user_logged_in;

            if (!user_id) {
                return res.status(401).json({ error: 'Not logged in' });
            }

            //Find the user by userId to get the list of users they are following
            const user = await users.findOne({ _id: new ObjectId(userId) });
            if (!user) {
                return res.status(404).json({ error: "User not found" });
            }

            const following = user.following;

            //Find posts from users that the current user is following
            const posts = await posts.find({
                author_id: { $in: following }
            }).toArray();

            //Retrieve images for posts that have image IDs
            for (let post of posts) {
                if (post.image_id) {
                    const image = await images.findOne({ _id: new ObjectId(post.image_id) });
                    if (image) {
                        //Add image data to the post
                        post.image = {
                            file_name: image.file_name,
                            path: image.path,
                        };
                    }
                }
            }

            //Respond with the posts in JSON format
            res.status(200).json(posts);
        } catch (error) {
            console.error("Error fetching posts:", error);
            res.status(500).json({ error: "Failed to fetch posts" });
        }
    });

    //POST route to follow a user
    app.post(`/${STUDENT_ID}/follow`, async (req, res) => {
        const { user_following } = req.body;
        const user_id = req.session?.user_logged_in;

        try {
            //Check if the user is logged in
            if (!user_id) {
                return res.status(401).json({ error: 'Not logged in' });
            }

            //Find the user to follow
            const following_user = await users.findOne({ username: user_following });
            if (!following_user) {
                return res.status(404).json({ error: "User not found" });
            }

            //Check if the logged-in user is already following this user
            const logged_in_user = await users.findOne({ _id: new ObjectId(user_id) });
            if (logged_in_user.following.includes(following_user._id)) {
                return res.status(400).json({ error: "Already following user" });
            }

            //Add the user to the following list
            await users.updateOne(
                { _id: new ObjectId(user_id) },
                { $push: { following: following_user._id } }
            );

            //Add the logged-in user to the followers list
            await users.updateOne(
                { _id: following_user._id },
                { $push: { followers: new ObjectId(user_id) } }
            );

            //Respond with a success message
            res.status(200).json({
                message: `You are now following ${usernameToFollow}`,
                following: usernameToFollow,
                followersUpdated: true
            });
        }
        catch (error) {
            console.error("Error following user:", error);
            res.status(500).json({ error: "Failed to follow user" });
        }
    });

    //DELETE route to unfollow a user
    app.delete(`/${STUDENT_ID}/follow`, async (req, res) => {
        const { user_unfollowing } = req.body;
        const user_id = req.session?.user_logged_in;

        try {
            //Check if the user is logged in
            if (!user_id) {
                return res.status(401).json({ error: 'Not logged in' });
            }

            //Find the user to follow
            const unfollowing_user = await users.findOne({ username: user_unfollowing });
            if (!unfollowing_user) {
                return res.status(404).json({ error: "User not found" });
            }

            //Check if the logged-in user is following the user
            const logged_in_user = await users.findOne({ _id: new ObjectId(user_id) });
            if (!logged_in_user.following.includes(unfollowing_user._id)) {
                return res.status(400).json({ error: "Not following user" });
            }

            //Remove the user from the following list
            await users.updateOne(
                { _id: new ObjectId(user_id) },
                { $pull: { following: unfollowing_user._id } }
            );

            //Remove the logged-in user from the followers list
            await users.updateOne(
                { _id: unfollowing_user._id },
                { $pull: { followers: new ObjectId(user_id) } }
            );

            //Respond with a success message
            res.status(200).json({
                message: `You are no longer following ${user_unfollowing}`,
                following: user_unfollowing,
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

            // Respond with the matching users
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

}).catch((error) => {
    console.error('Error connecting to MongoDB:', error);
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}/${STUDENT_ID}/`);
});
