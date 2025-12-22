// Navbar scroll effect
$(window).scroll(function () {
    if ($(window).scrollTop() > 50) {
        $('.navbar').addClass('scrolled');
    } else {
        $('.navbar').removeClass('scrolled');
    }
});

// Active link highlighting
$(document).ready(function () {
    $('.nav-link').each(function () {
        if ($(this).attr('href') === window.location.pathname) {
            $(this).addClass('active');
        }
    });
});

// Smooth scrolling for anchor links
$(document).on('click', 'a[href^="#"]', function (e) {
    e.preventDefault();
    var target = $(this.hash);
    if (target.length) {
        $('html, body').animate({
            scrollTop: target.offset().top - 80
        }, 800);
    }
});

// Add animation to elements when they come into view
$(window).scroll(function () {
    $('.animate-on-scroll').each(function () {
        var elementTop = $(this).offset().top;
        var elementBottom = elementTop + $(this).outerHeight();
        var viewportTop = $(window).scrollTop();
        var viewportBottom = viewportTop + $(window).height();

        if (elementBottom > viewportTop && elementTop < viewportBottom) {
            $(this).addClass('animated');
        }
    });
});
