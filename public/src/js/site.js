$(document).ready(function () {
    const themeToggle = $('[data-theme-toggle]');

    // Set the initial theme based on the data-theme attribute
    function setTheme(theme) {
        $('html').attr('data-theme', theme);
        localStorage.setItem('theme', theme);
    }

    // Load the saved theme from localStorage
    const savedTheme = localStorage.getItem('theme') || 'dark';
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
