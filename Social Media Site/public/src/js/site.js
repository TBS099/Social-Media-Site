
//Function to toggle between light and dark theme
$(document).ready(function () {
    const themeToggle = $('[data-theme-toggle]');

    // Set the initial theme based on the data-theme attribute
    function setTheme(theme) {
        $('html').attr('data-theme', theme);
        localStorage.setItem('theme', theme);

        if (theme === 'light') {
            themeToggle.prop('checked', true);
        }
    }

    // Load the saved theme from localStorage
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);

    // Event listener for theme toggle switch
    themeToggle.on('change', function () {
        if (this.checked) {
            setTheme('light');
        } else {
            setTheme('dark');
        }
    });
});

// Function to handle the like click
function handle_post_like(postId, userId) {
    const count = document.getElementById(`count-${postId}`);

    // Parse the current count and increment it
    let current_count = parseInt(count.textContent);
    current_count += 1;

    // Update the like count in the <p> element
    count.textContent = current_count;

    // Log a message to the console
    console.log(`Post ${postId} liked! Total likes: ${current_count}. Liked by user ${userId}`);
}

//Function to handle follow button click
function follow_user(follower_id, user_id) {
    const user_followers = document.getElementById("followers-count");
    const follow_button = document.getElementById("follow-btn");

    //Pare the current count and increment it
    let followers_count = parseInt(user_followers.textContent);

    if (follow_button.textContent == "Following") {
        //If the user is already following, then unfollow
        followers_count -= 1;

        //Change button color and text
        follow_button.style.backgroundColor = "var(--accent)";
        follow_button.textContent = "Follow";

        //Log a message to the console
        console.log(`User ${follower_id} unfollowed user ${user_id}`);
    } else {
        //If the user is not following, then follow
        followers_count += 1;

        //Change button color and text
        follow_button.style.backgroundColor = "var(--following-btn)";
        follow_button.textContent = "Following";

        //Log a message to the console
        console.log(`User ${follower_id} followed user ${user_id}`);
    }

    //Update the followers count in the <p> element
    user_followers.textContent = followers_count;
}

// Function to create a post on the basis of the provided data
function create_post(post) {
    const post_template = `
    <div class="post-container"> //Remove this div when creating the post function, only to be used in home page
        <div class="post">
            <div class="post-header">
                <img src="{post.profilePicture}" alt="Profile Picture" class="profile-picture">
                <p class="author-name">${post.author}</p>
                <p class="post-date">${post.date}</p>
            </div>
            <p class="post-content">${post.content}</p>
            <div class="post-footer">
                <div class="like">
                    <i class="far fa-heart" id="${post.ID}" onclick="handle_post_like(${post.ID}, ${user_id})"></i>
                    <p class="like-count" id="count-${post.ID}">${post.like}</p>
                </div>
                <div class="comment">
                    <i class="far fa-comment"></i>
                    <p class="comment-count">${post.comment}</p>
                </div>
            </div>
        </div>
    </div>`;

    return post_template;
}

// Function to create a profile page on the basis of the provided data
function create_profile() {
    const profile_template = `
    <div class="profile-container">
                <div class="profile">
                    <div class="profile-header">
                        <div class="username-container">
                            <h3 class="profile-username">{profile.username}</h3>
                        </div>
                        <div class="profile-details">
                            <img class="profile-image" src="{profile.picture}" alt="profile">
                            <div class="profile-info">
                                <div class="profile-counts">
                                    <div class="count">
                                        <p>Posts</p>
                                        <p id="post-count">{profile.post}</p>
                                    </div>
                                    <div class="count">
                                        <p>Followers</p>
                                        <p id="followers-count">{profile.followers}</p>
                                    </div>
                                    <div class="count">
                                        <p>Following</p>
                                        <p id="following-count">{profile.following}</p>
                                    </div>
                                </div>
                                <button id="follow-btn" type="button" onClick="follow_user({user_id},{profile.id})">Follow</button>

                            </div>
                        </div>
                        <div class="profile-bio">
                            <p class="bio">
                                {profile.bio}
                            </p>
                        </div>
                    </div>
                </div>
                <div class="posts">
                    <h4 class="posts-title">Posts</h4>
                </div>
            </div>`;

    return profile_template;
}