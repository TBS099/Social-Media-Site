//GLOBAL VARIABLES
const STUDENT_ID = "YOUR-ID"; //Replace this with your student ID

$(document).ready(function () {
    console.log("DOM is fully loaded");
    handle_logout(); //Call the logout function
    handle_create_post_popup(); //Call the post popup function
    handle_post_submit(); //Call the post submit function
    search_content(); //Call the search content function

    //Initialize necessary variables
    let user_id = 0;
    let following = [];
    const theme_toggle = $('[data-theme-toggle]');


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

    //Toggle the search form and overlay visibility
    $('.search-btn').on('click', function () {
        $('#search-form').toggleClass('active');
        $('.overlay').toggleClass('active'); //Show/hide overlay
    });

    //Hide the search form and overlay when the overlay is clicked
    $('.overlay').on('click', function () {
        $('#search-form').removeClass('active');
        $(this).removeClass('active'); //Hide overlay
    });

    //Check text box and adjust div height
    $("textarea").on("input", function () {
        //Reset the height of the current textarea to calculate its height dynamically
        $(this).css("height", "auto");
        $(this).css("height", `${this.scrollHeight}px`);

        //Calculate the combined height of both textareas
        const postContentHeight = $("#post-content").prop("scrollHeight");
        const postTagsHeight = $("#post-tags").prop("scrollHeight");

        //Adjust the height of the .post-creation box
        $(".post-creation").css("height", `${postContentHeight + postTagsHeight + 355}px`); //Add padding/margin if needed
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
            following = data.following;
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
                if (user_id != 0) {
                    $("#loader").hide();
                    $("#container").css("justify-content", "normal");
                    return home_page(user_id, following); //Render the home page
                }
                else {
                    redirect_to_login();
                }

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
                if (user_id != 0) {
                    $("#loader").hide();
                    return search_page(user_id, following); //Render the search form
                }
                else {
                    redirect_to_login();
                }

            case `/${STUDENT_ID}/create`:
                $("#loader").hide();
                if (user_id != 0) {
                    return post_creation_popup(); //Render the post creation form
                } else {
                    redirect_to_login();
                }
                break;

            case `/${STUDENT_ID}/latest`:
                if (user_id != 0) {
                    $("#loader").hide();
                    $("#container").css("justify-content", "normal"); //Use jQuery to set the flexbox alignment
                    return latest_posts_page(user_id, following); //Render the latest posts page
                }
                else {
                    redirect_to_login();
                }
                break;

            default:
                $("#loader").hide();
                return "<h1>404 Not Found</h1>";
        }
    }

    //Redirect to login page
    function redirect_to_login() {
        window.location.href = `/${STUDENT_ID}/surfer-login`; //Perform a full-page reload to the home page
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
            $("#hide-home").show();
            $("#hide-latest").show();
            $("#hide-search").show();
            $("#hide-logout").show();
            $("#hide-create").show();
        } else {
            $("#hide-home").hide();
            $("#hide-latest").hide();
            $("#hide-search").hide();
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
            //Send the login data as JSON
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
            //Send the post data as JSON
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
async function home_page(user_id, following) {
    try {
        //Fetch the posts from the server
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
                postHTML += create_post(post, user_id, following);
            });
            postHTML += "</div>";
            return postHTML;
        }
    } catch (error) {
        console.error("Error fetching posts:", error);
        return "<p>Could not load posts. Please try again later.</p>";
    }
}

async function latest_posts_page(user_id, following) {
    try {
        //Fetch the latest posts from the server
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
                postHTML += create_post(post, user_id, following);
            });
            postHTML += "</div>";
            return postHTML;
        }
    } catch (error) {
        console.error("Error fetching posts:", error);
        container.innerHTML = "<p>Could not load posts. Please try again later.</p>";
    }
}

//Function to show create post popup
function handle_create_post_popup() {
    const popup_link = $("#popup-link");
    const popup = $("#post-popup");
    const popup_div = $(".post-creation");

    //Setting event listener for toggling the popup
    popup_link.on("click", function (event) {
        event.preventDefault();
        popup.toggleClass("visible");
    });

    //Setting event listener to hide the popup when clicking outside
    $(document).on("click", function (event) {
        if (!popup_div.is(event.target) && popup_div.has(event.target).length === 0 && !popup_link.is(event.target)) {
            popup.removeClass("visible");
        }
    });
}

//Function to handle logout
async function handle_logout() {
    const logout_link = $("#hide-logout");

    logout_link.on("click", async function (event) {
        event.preventDefault();

        try {
            //Send a DELETE request to the server to logout the user
            const response = await fetch(`/${STUDENT_ID}/login`, {
                method: "DELETE",  //Correctly using DELETE method
                headers: {
                    "Content-Type": "application/json",
                }
            });

            if (response.ok) {
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
async function follow_user(follower_id) {
    const user_followers = $("#followers-count");

    try {
        const formData = {
            user_following: follower_id, //This will be the ObjectId of the user being followed
        };

        //Send a POST request to the server to follow the user
        const response = await $.ajax({
            url: `/${STUDENT_ID}/follow`,
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify(formData),
        });

        //If the request was successful, increment the followers count
        if (response) {
            //Log a message to the console
            console.log(`User ${follower_id} followed successfully.`);

            //Dynamically select the follow/unfollow buttons based on post._id
            const followButton = $(`.follow-btn-${follower_id}`);
            const unfollowButton = $(`.unfollow-btn-${follower_id}`);
            followButton.hide(); //Hide the follow button
            unfollowButton.show(); //Show the unfollow button

            //Send success message to the user
            form_message = document.getElementById("follow-msg");
            form_title = document.getElementsByClassName("navbar")[0];
            show_feedback_message("success", "User followed successfully", form_title, form_message);

            setTimeout(function () {
                form_message.innerHTML = "";
            }, 3000);
        }
    } catch (error) {
        console.error("Error following user:", error.responseJSON?.message || error.statusText || "Follow failed");

        //Send Error message to the user
        form_message = document.getElementById("follow-msg");
        form_title = document.getElementsByClassName("navbar")[0];
        show_feedback_message("error", "Error Following user", form_title, form_message);

        setTimeout(function () {
            form_message.innerHTML = "";
        }, 3000);
    }
}

//Function to handle unfollow button click
async function unfollow_user(follower_id) {
    const user_followers = $("#followers-count");

    try {
        const formData = {
            user_unfollowing: follower_id, //This will be the ObjectId of the user being followed
        };

        //Send a DELETE request to the server to follow the user
        const response = await $.ajax({
            url: `/${STUDENT_ID}/follow`,
            type: "DELETE",
            contentType: "application/json",
            data: JSON.stringify(formData),
        });

        //If the request was successful, increment the followers count
        if (response) {
            //Log a message to the console
            console.log(`User ${follower_id} unfollowed successfully.`);

            //Dynamically select the follow/unfollow buttons based on post._id
            const followButton = $(`.follow-btn-${follower_id}`);
            const unfollowButton = $(`.unfollow-btn-${follower_id}`);
            followButton.show(); //Hide the follow button
            unfollowButton.hide(); //Show the unfollow button

            //Send success message to the user
            form_message = document.getElementById("follow-msg");
            form_title = document.getElementsByClassName("navbar")[0];
            show_feedback_message("success", "User unfollowed successfully", form_title, form_message);

            setTimeout(function () {
                form_message.innerHTML = "";
            }, 3000);
        }
    } catch (error) {
        console.error("Error unfollowing user:", error.responseJSON?.message || error.statusText || "Follow failed");

        //Send error message to the user
        form_message = document.getElementById("follow-msg");
        form_title = document.getElementsByClassName("navbar")[0];
        show_feedback_message("error", "User unfollowed successfully", form_title, form_message);

        setTimeout(function () {
            form_message.innerHTML = "";
        }, 3000);
    }
}

//Function to change page to search page
function search_content() {
    $("#search-form").on("submit", async function (event) {
        event.preventDefault(); //Prevent the default form submission

        const query = $("#search-input").val(); //Get the search query

        try {
            window.location.href = `/${STUDENT_ID}/search?query=${encodeURIComponent(query)}`;
        }
        catch (error) {
            console.error("Error searching:", error);
        }
    });
}

//Function to create a search page
async function search_page(user_id, following) {
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('query');

    if (!query) {
        urlParams.get('search');
    }

    try {
        let searchHTML = `
        <form id="search-page-form" class="search-form">
            <input type="text" id="search-input" name="query" placeholder="Search..." required>
            <button type="submit" class="search-submit-btn"><i class="fas fa-search"></i></button>
        </form>
        <h2 class="search-result">Search results for: ${query}</h2>
        <div class="search-options">
            <a class="search" id="search-users" onclick="toggle_results(event)">Users</a>
            <a class="search active" id="search-posts" onclick="toggle_results(event)">Posts</a>
        </div>
        `;

        //Fetch the posts from the server
        const response = await fetch(`/${STUDENT_ID}/contents/search?query=${query}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            }
        });

        if (!response.ok) {
            searchHTML += `
            <div class='post-container'>
                <h1>No posts found</h1>
            </div>
            `;
        }
        const posts = await response.json();

        //Fetch the users from the server
        const responseUsers = await fetch(`/${STUDENT_ID}/users/search?query=${query}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            }
        });

        if (!responseUsers.ok) {
            searchHTML += `
            <div class='users-container'>
                <h1>No users found</h1>
            </div>
            `;
        }
        const users = await responseUsers.json();

        if (posts.length === 0) {
            searchHTML += `
            <div class='post-container'>
                <h1>No posts found</h1>
            </div>
            `;
        } else {
            searchHTML += "<div class='post-container'>";
            posts.forEach(post => {
                searchHTML += create_post(post, user_id, following);
            });
            searchHTML += "</div>";
        }

        if (users.length === 0) {
            searchHTML += `
           <div class='users-container'>
                <h1>No users found</h1>
            </div>
            `;
        }
        else {
            searchHTML += "<div class='users-container'>";
            users.forEach(user => {
                searchHTML += create_profile_cards(user, user_id, following);
            });
            searchHTML += "</div>";
        }
        return searchHTML;
    } catch (error) {
        console.error("Error fetching posts:", error);
        return "<p>Could not load posts. Please try again later.</p>";
    }
}

//Function to create a post on the basis of the provided data
function create_post(post, user_id, following) {
    const isFollowing = following.includes(post.author_id);
    const followButtonDisplay = isFollowing ? "none" : "block";
    const unfollowButtonDisplay = isFollowing ? "block" : "none";
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

    let post_template = "";

    if (post.author_id != user_id) {
        post_template = `
        <div class="post">
            <div class="post-header">
                <p class="author-name">${post.author_name}</p>
                <div class="follow-btns">
                <button id="follow-btn-${post._id}" class="profile-btn follow follow-btn-${post.author_id}" type="button" onclick="follow_user('${post.author_id}')" style="display: ${followButtonDisplay}">Follow</button>
                <button id="unfollow-btn-${post._id}" class="profile-btn following unfollow-btn-${post.author_id}" type="button" onclick="unfollow_user('${post.author_id}')" style="display: ${unfollowButtonDisplay}">Following</button>
                </div>
                <p class="post-date">${formatted_date}</p>
            </div>
            <p class="post-content">${post.content}</p>
            <div class="post-tags">
                ${post.tags.map(tag => `<span class="tag">${tag}</span>`).join(' ')}
            </div>
            <div class="post-footer">
            </div>
        </div>
    `;
    }

    return post_template;
}

function create_profile_cards(user, user_id, following) {
    let template = "";
    const isFollowing = following.includes(user._id);
    const followButtonDisplay = isFollowing ? "none" : "block";
    const unfollowButtonDisplay = isFollowing ? "block" : "none";
    if (user_id != user._id) {
        template = `
            <div class='user-profile'>
                <div class='username'>
                    <p class="author-name">${user.username}</p>
                </div>
                <div class="follow-btns">
                    <button id="follow-btn-${user._id}" class="profile-btn follow follow-btn-${user._id}" type="button" onclick="follow_user('${user._id}')" style="display: ${followButtonDisplay}">Follow</button>
                    <button id="unfollow-btn-${user._id}" class="profile-btn following unfollow-btn-${user._id}" type="button" onclick="unfollow_user('${user._id}')" style="display: ${unfollowButtonDisplay}">Following</button>
                </div>
            </div>
        `;
    }
    return template
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

//Function to show search bar
document.querySelector('.search-btn').addEventListener('click', (e) => {
    e.preventDefault(); //Prevent default form submission
    const searchContainer = document.querySelector('#hide-search');
    searchContainer.classList.toggle('active');
});

//Function to toggle search results
function toggle_results(event) {
    const $searchPosts = $('#search-posts');
    const $searchUsers = $('#search-users');

    if ($(event.target).is('#search-posts')) {

        $searchPosts.addClass('active');
        $searchUsers.removeClass('active');
        $('.users-container').hide();
        $('.post-container').show();
    } else if ($(event.target).is('#search-users')) {

        $searchPosts.removeClass('active');
        $searchUsers.addClass('active');
        $('.post-container').hide();
        $('.users-container').show();
    }
}
