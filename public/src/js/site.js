
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
function handle_post_like(postId) {
    const icon = document.getElementById(`${postId}`);
    const count = document.getElementById(`count-${postId}`);

    // Parse the current count and increment it
    let current_count = parseInt(count.textContent);
    current_count += 1;

    // Update the like count in the <p> element
    count.textContent = current_count;

    // Log a message to the console
    console.log(`Post ${postId} liked! Total likes: ${current_count}`);
}

// Function to create a post on the basis of the provided data
function create_post(post) {
    const post_template = `
    <div class="post-container">
        <div class="post">
            <div class="post-header">
                <img src="{post.profilePicture}" alt="Profile Picture" class="profile-picture">
                <p class="author-name">${post.author}</p>
                <p class="post-date">${post.date}</p>
            </div>
            <p class="post-content">${post.content}</p>
            <div class="post-footer">
                <div class="like">
                    <i class="far fa-heart" id="${post.ID}" onclick="handle_post_like(${post.ID})"></i>
                    <p class="like-count" id="count-${post.ID}">${post.like}</p>
                </div>
                <div class="comment">
                    <i class="far fa-comment"></i>
                    <p class="comment-count">${post.comment}</p>
                </div>
            </div>
        </div>
    </div>`

    return post_template;
}

