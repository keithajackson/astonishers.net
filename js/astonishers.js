/**
  * astonishers - client file
  * PURPOSE: Uses Book and Page classes to dynamically load Tumblr posts into
  *			 the current HTML document, responding to user navigation commands.
  * REQUIRES: Book.js, Page.js
  */

// ------------------
// INSTANCE VARIABLES
// ------------------
var astonishers;	// will be initialized as a
					// Book in $('#contentPane').on('pageinit')


// Callback function used to display Page objects returned by
// calls to the astonishers Book.  Ignores page fetch failures.
function displayPage(pageObj) {
	if (console) console.log(pageObj)
	if(pageObj == false)
		// This might be OK -- we will get this error when
		// the user tries to go past the last page, which is
		// already handled.
		if (console) console.log("Failed to load page.")
	else {
		// Replace the Page contents and scroll back
		// to the top.
		$("#mainContent").empty();
		$("#mainContent").html(pageObj.getElement());
		window.scrollTo(0, 0);

		// Set the header to the new page label.
		$("#pageLabel").html(pageObj.getLabel());

		// Save our place in the site cookie
		setCookie("chapter", astonishers.getCurrentChapterIndex(),30);
		setCookie("page", astonishers.getCurrentPageIndex(),30);
	}
}

// Handles clicking on the "Previous" navigation button
$("#previousPage").click(function(event) {
	astonishers.getPreviousPage(displayPage);
});

// Handles clicking on the "Next" navigation button
$("#nextPage").click(function(event) {
	astonishers.getNextPage(displayPage);
});

// Causes left and right arrow keys to navigate to the next and
// previous pages, respectively
$(document).keydown(function(e){
    if (e.keyCode == 37) {	// left arrow
		astonishers.getPreviousPage(displayPage);
    }
	else if (e.keyCode == 39){
		astonishers.getNextPage(displayPage);
	}
});

// Handles clicking on the "navigation" button.
// Calls for the astonishers Book to load the UI navigation
// table of contents, then displays it as a popup.
$("#showNavBtn").click(function(event) {
	astonishers.loadNavTOC(function() {$("#navPane").popup("open", {positionTo: "window"});});
});

// Initialization code to run when the contentPane (main page)
// is ready.  This is equivalent to the $(document).ready() bind
// in conventional JQuery.
// After init, immediately loads a page while constructing the Book
// in the background. If there is a user cookie with the last visited page,
// the site will start there; if not, it will start at the very first
// page of the comic.
$('#contentPane').on('pageinit', function() {
	// Get cookie information (will return empty strings
	// if no cookies are present)
	var cookieChapter = getCookie("chapter");
	var cookiePage = getCookie("page");
	var suppressSplash = getCookie("suppressSplash");

	// Check if the cookie chapter/page is valid
	if(cookieChapter != "" && !isNaN(cookieChapter) && cookiePage != "" && !isNaN(cookiePage)) {
		if (console) console.log("Loading chapter " + cookieChapter + ", page " + cookiePage);

		// Create book and jump to the saved page
		astonishers = new Book(cookieChapter, cookiePage, displayPage);
	} else {
		if (console) console.log("No cookie.  We are starting at the beginning.");

		// Create book and start at beginning.
		astonishers = new Book(0, 0, displayPage);
	}

});
