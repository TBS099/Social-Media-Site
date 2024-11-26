//GLOBAL VARIABLES
const STUDENT_ID = "YOUR-ID"; //Replace this with your student ID

$(document).ready(function () {
    console.log("DOM is fully loaded");
    handle_logout(); //Call the logout function
    handle_create_post_popup(); //Call the post popup function
    handle_post_submit(); //Call the post submit function

    //Initialize necessary variables
    let user_id = 0; //Initialize user_id
    const theme_toggle = $('[data-theme-toggle]');
    const textarea = document.getElementById("post-content");
    const postCreation = document.querySelector(".post-creation");

    //Function to set the theme
    function set_theme(theme) {
        $('html').attr('data-theme', theme);
        localStorage.setItem('theme', theme);

        if (theme === 'light') {
            theme_toggle.prop('checked', true);
        }
    }

    //Load the saved theme from localStorage and set it
    const saved_theme = localStorage.getItem('theme') || 'light';
    set_theme(saved_theme);

    //Event listener for theme toggle switch
    theme_toggle.on('change', function () {
        if (this.checked) {
            set_theme('light');
        } else {
            set_theme('dark');
        }
    });

    //Function to adjust the height of the parent container
    textarea.addEventListener("input", () => {
        //Reset textarea height to calculate the new height dynamically
        textarea.style.height = "auto";
        textarea.style.height = `${textarea.scrollHeight}px`;

        //Adjust the height of the .post-creation box
        postCreation.style.height = `${textarea.scrollHeight + 355}px`; //Add padding/margin if needed
    });


    //Fetch the user's login status on page load
    fetch(`/${STUDENT_ID}/login`, {
        method: "GET",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
    })
        .then((response) => {
            if (response.ok) {
                return response.json();
            } else {
                return { user_id: 0 };
            }
        })
        .then((data) => {
            user_id = data.user_id || 0; //Update the user_id
            console.log(user_id);  //Log the user_id value
            display_content(window.location.pathname); //Display the content for the current URL
            toggle_navigation_links(user_id); //Toggle login/register links based on user_id
        });

    //Function to display content based on the current URL
    async function display_content(url) {
        const content = await get_content(url);
        $("#container").html(content); //Use jQuery to inject content into the main container
    }

    //Function to fetch the appropriate content based on the URL
    async function get_content(route) {
        switch (route) {
            case `/${STUDENT_ID}/`:
                $("#loader").hide();
                $("#container").css("justify-content", "normal"); //Use jQuery to set the flexbox alignment
                return home_page(user_id);

            case `/${STUDENT_ID}/profile/${user_id}`:
                $("#loader").hide();
                if (user_id === 0) {
                    return "<h1>404 Not Found</h1>";
                }
                return profile_page();

            case `/${STUDENT_ID}/register`:
                $("#loader").hide();
                if (!user_id || user_id === 0) {
                    return create_register_page(); //Render the registration form
                } else {
                    redirect_to_home();
                }
                break;

            case `/${STUDENT_ID}/surfer-login`:
                $("#loader").hide();
                if (!user_id || user_id === 0) {
                    return create_login_page(); //Render the login form
                } else {
                    redirect_to_home();
                }
                break;

            case `/${STUDENT_ID}/search`:
                $("#loader").hide();
                return search_page(); //Render the search form

            case `/${STUDENT_ID}/create`:
                $("#loader").hide();
                if (user_id != 0) {
                    return post_creation_popup(); //Render the post creation form
                } else {
                    redirect_to_home();
                }
                break;
            default:
                $("#loader").hide();
                return "<h1>404 Not Found</h1>";
        }
    }

    //Redirect to home page
    function redirect_to_home() {
        window.location.href = `/${STUDENT_ID}/`; //Perform a full-page reload to the home page
    }

    //Function to toggle login/register links based on login status
    function toggle_navigation_links(user_id) {
        if (user_id != 0) {
            $("#hide-login").hide();
            $("#hide-register").hide();
            $("#hide-logout").show();
            $("#hide-create").show();
        } else {
            $("#hide-logout").hide();
            $("#hide-create").hide();
            $("#hide-login").show();
            $("#hide-register").show();
        }
    }
});

//Function to handle registration form submission
async function handle_register_form() {
    const register_form = $("#register-form");
    const form_message = $("#form-message");
    const form_title = $("#register-form-title");

    register_form.on("submit", async function (event) {
        event.preventDefault(); //Prevent page reload
        form_message.html("");

        //Get the form data
        const username = register_form.find("input[name='username']").val();
        const email = register_form.find("input[name='email']").val();
        const password = register_form.find("input[name='password']").val();
        const confirm_password = register_form.find("input[name='confirm_password']").val();

        if (registration_validation(email, password, confirm_password)) {
            const formData = {
                username: username,
                email: email,
                password: password
            };

            try {
                //Send the registration data as JSON
                const res = await fetch(`/${STUDENT_ID}/users`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(formData),
                });

                if (!res.ok) {
                    const error_msg = await res.json();
                    console.error('Error response:', error_msg);
                    show_feedback_message("error", error_msg.error, form_title[0], form_message[0]);
                } else {
                    const data = await res.json();
                    show_feedback_message("success", data.message, form_title[0], form_message[0]);
                    setTimeout(function () {
                        window.location.href = `/${STUDENT_ID}/`;
                    }, 1000);
                }
            } catch (error) {
                console.error("Error registering user:", error);
                show_feedback_message("error", "An error occurred. Please try again later.", form_title[0], form_message[0]);
            }
        } else {
            console.log("Validation failed");
        }
    });
}

//Function to handle login form submission
async function handle_login_form() {
    const login_form = $("#login-form");
    const form_message = $("#form-message");
    const form_title = $("#login-form-title");

    login_form.on("submit", async function (event) {
        event.preventDefault(); //Prevent page reload
        form_message.html("");

        //Get the form data
        const username = login_form.find("input[name='username']").val();
        const password = login_form.find("input[name='password']").val();

        const formData = {
            username: username,
            password: password
        };

        try {
            const res = await fetch(`/${STUDENT_ID}/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            });

            if (!res.ok) {
                const error_msg = await res.json();
                console.error('Error response:', error_msg);
                show_feedback_message("error", error_msg, form_title[0], form_message[0]);
            } else {
                const data = await res.json();
                show_feedback_message("success", data.message, form_title[0], form_message[0]);
                setTimeout(function () {
                    window.location.href = `/${STUDENT_ID}/`;
                }, 1000);
            }
        } catch (error) {
            console.error("Error logging in user:", error);
            show_feedback_message("error", "An error occurred. Please try again later.", form_title[0], form_message[0]);
        }
    });
}

//Function to handle post creation form submission
async function handle_post_submit() {
    const form = $("#create-post-form");
    const form_message = $("#create-post-form-message");
    const form_title = $("#create-post-form-title");

    form.on("submit", async function (event) {
        event.preventDefault(); //Prevent page reload

        //Get the form data
        const content = form.find("textarea[name='content']").val();
        const tags = form.find("textarea[name='tags']").val();

        const formData = {
            content: content,
            tags: tags,
        };

        try {
            const response = await fetch(`/${STUDENT_ID}/contents`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Error creating post:', errorData.message || 'Post creation failed');
                show_feedback_message("error", errorData.message || 'Post creation failed', form_title[0], form_message[0]);
            } else {
                const data = await response.json();
                show_feedback_message("success", data.message, form_title[0], form_message[0]);
                setTimeout(function () {
                    window.location.href = `/${STUDENT_ID}/`;
                }, 1000);
            }
        }
        catch (error) {
            console.error("Error creating post:", error);
            show_feedback_message("error", "An error occurred. Please try again later.", form_title[0], form_message[0]);
        }
    });
}

//Function to create a home page
async function home_page(user_id) {
    if (user_id != 0) {
        try {
            const response = await fetch(`/${STUDENT_ID}/contents`, {
                method: "GET",
                credentials: 'include',
                headers: {
                    "Content-Type": "application/json",
                }
            });

            if (!response.ok) {
                return "<h1>No posts found</h1>";
            }

            const posts = await response.json();

            if (posts.length === 0) {
                return "<h1>No posts found.</h1>";
            } else {
                let postHTML = "<div class='post-container'>";
                posts.forEach(post => {
                    postHTML += create_post(post, user_id);
                });
                postHTML += "</div>";
                return postHTML;
            }
        } catch (error) {
            console.error("Error fetching posts:", error);
            return "<p>Could not load posts. Please try again later.</p>";
        }
    } else {
        try {
            const response = await fetch(`/${STUDENT_ID}/contents/latest`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                }
            });

            if (!response.ok) {
                return "<h1>No posts found</h1>";
            }

            const posts = await response.json();

            if (posts.length === 0) {
                return "<h1>No posts found</h1>";
            } else {
                let postHTML = "<div class='post-container'>";
                posts.forEach(post => {
                    postHTML += create_post(post, user_id);
                });
                postHTML += "</div>";
                return postHTML;
            }
        } catch (error) {
            console.error("Error fetching posts:", error);
            container.innerHTML = "<p>Could not load posts. Please try again later.</p>";
        }
    }
}

//Function to show create post popup
function handle_create_post_popup() {
    const popup_link = $("#popup-link");
    const popup = $("#post-popup");
    const popup_div = $(".post-creation")


    //Setting event listenter
    //Setting event listener for toggling the popup
    popup_link.on("click", function (event) {
        event.preventDefault(); //Prevent default link behavior
        popup.toggleClass("visible"); //Show the popup if hidden, hide it if visible
    });

    $(document).on("click", function (event) {
        if (!popup_div.is(event.target) && popup_div.has(event.target).length === 0 && !popup_link.is(event.target)) {
            popup.removeClass("visible"); //Hide the popup if the click is outside
        }
    });
}

//Function to handle logout
async function handle_logout() {
    const logout_link = $("#hide-logout");

    //Setting event listener
    logout_link.on("click", async function (event) {
        event.preventDefault();

        try {
            const response = await fetch(`/${STUDENT_ID}/login`, {
                method: "DELETE",  //Correctly using DELETE method
                headers: {
                    "Content-Type": "application/json",
                }
            });

            if (response.ok) {
                const data = await response.json();
                console.log(data.message);  //Log the success message

                //Delay the redirection to ensure session destruction is complete
                setTimeout(function () {
                    window.location.href = `/${STUDENT_ID}/`;  //Redirect after successful logout
                }, 500);  //Small delay to ensure session is cleared
            } else {
                const errorData = await response.json();
                console.error('Error logging out:', errorData.message || 'Logout failed');
            }
        } catch (error) {
            console.error("Error logging out:", error);
        }
    });
}


//Function to handle the like click
function handle_post_like(postId, userId) {
    const count = document.getElementById(`count-${postId}`);

    //Parse the current count and increment it
    let current_count = parseInt(count.textContent);
    current_count += 1;

    //Update the like count in the <p> element
    count.textContent = current_count;

    //Log a message to the console
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

//Function to create a post on the basis of the provided data
function create_post(post, user_id) {
    //Format the date
    const post_date = new Date(post.date);
    const formatted_date = new Intl.DateTimeFormat('en-GB', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    }).format(post_date);

    const post_template = `
        <div class="post">
            <div class="post-header">
                <p class="author-name">${post.author_name}</p>
                <p class="post-date">${formatted_date}</p>
            </div>
            <p class="post-content">${post.content}</p>
            <div class="post-footer">
                <div class="like">
                    <i class="far fa-heart" id="${post._id}" onclick="handle_post_like(${post._id}, ${user_id})"></i>
                    <p class="like-count" id="count-${post._id}">${post.like}</p>
                </div>
            </div>
        </div>
    `;

    return post_template;
}

//Function to create a profile page on the basis of the provided data
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
            <div class="post-container">
            </div>
        </div>
    </div>`;

    return profile_template;
}

//Function to create a profile page
function create_register_page() {
    return `
    <div class="form-container">
        <form id="register-form" class="form" action="" enctype="multipart/form-data">
            <h3 id="register-form-title">Register</h3>
            <div id="form-message"></div>
            <div class="form-text">
                <div class="form-group">
                    <div class="label-div">
                        <label for="username">Username:</label>
                    </div>
                    <input type="text" id="username" name="username" required>
                </div>
                <div class="form-group">
                    <div class="label-div">
                        <label for="email">Email:</label>
                    </div>
                    <input type="email" id="email" name="email" required>
                </div>
                <div class="form-group">
                    <div class="label-div">
                        <label for="password">Password:</label>
                    </div>
                    <input type="password" id="password" name="password" required>
                </div>
                <div class="form-group">
                    <div class="label-div">
                    <label for="confirm_password">Confirm Password:</label>
                    </div>
                    <input type="password" id="confirm-password" name="confirm_password" required>
                </div>
            </div>
            <div class="form-group image-upload">
                <label for="profilePicture">Profile Picture:</label>
                <input type="file" id="profilePicture" name="profilePicture" accept="image/*" required>
            </div>
            <button type="submit" onclick="handle_register_form()">Register</button>
        </form>
    </div>
    `;
}

//Function to create a login page
function create_login_page() {
    return `
    <div class="form-container login">
        <form id="login-form" class="form" action="" enctype="multipart/form-data">
            <h3 id="login-form-title">Login</h3>
            <div id="form-message"></div>
            <div class="form-text">
                <div class="form-group">
                    <div class="label-div">
                        <label for="username">Username:</label>
                    </div>
                    <input type="text" id="username" name="username" required>
                </div>
                <div class="form-group">
                    <div class="label-div">
                        <label for="password">Password:</label>
                    </div>
                    <input type="password" id="password" name="password" required>
                </div>
            </div>
            <button type="submit" onclick="handle_login_form()">Login</button>
        </form>
    </div>
    `;
}

//Function to show messages (both error and success)
function show_feedback_message(type, message, form_title, form_message) {
    $(form_title).css('margin-bottom', '20px');
    $(form_message).html(`<div class="${type} message">${message}</div>`);
}

//Function to validate the registration form
function registration_validation(email, password, confirm_password) {
    const form_message = document.getElementById("form-message");
    const form_title = document.getElementById("register-form-title");
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (password !== confirm_password) {
        show_feedback_message("error", "Passwords do not match", form_title, form_message);
        return false;
    }

    if (password.length < 6) {
        show_feedback_message("error", "Password must be at least 6 characters long", form_title, form_message);
        return false;
    }

    if (!emailPattern.test(email)) {
        show_feedback_message('error', 'Invalid email format', form_title, form_message);
        return false;
    }

    return true;
}