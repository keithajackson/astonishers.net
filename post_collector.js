var isDesktop;
// Authenticate via API Key
var tumblr;
var client;


/* JQuery: Populate the table as soon as the page is loaded. */
$(document).ready(function () {
    isDesktop = ($(window).width() > 700);
	
	// Make the request
	$.ajax({
		url: "http://api.tumblr.com/v2/blog/astonishers.tumblr.com/posts/photo?callback=?",
		data : ({
			api_key: 'BoJ3Xrg6F6oJA1T5TmK7bn387agH9oAwGV4FoMRBET2rSSYwYK',
			tag: 'comics'
		}),

		dataType: "jsonp",

		success: function (data) {
			console.log("Response from JSON!");
			console.log(data);
			console.log("First image URL: " + data.response.posts[0].photos[0].original_size.url);
		}
	})
});

