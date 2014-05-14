// -------
// CLASSES
// -------






		
// ------------------
// INSTANCE VARIABLES
// ------------------
var astonishers;

// cookie stuff for picking up location where user
// left off
// http://www.w3schools.com/js/js_cookies.asp
function getCookie(cname) {
	var name = cname + "=";
	var ca = document.cookie.split(';');
	for(var i=0; i<ca.length; i++) {
		var c = ca[i].trim();
		if (c.indexOf(name)==0) return c.substring(name.length,c.length);
	}
	return "";
} 

function setCookie(cname,cvalue,exdays) {
	var d = new Date();
	d.setTime(d.getTime()+(exdays*24*60*60*1000));
	var expires = "expires="+d.toGMTString();
	document.cookie = cname + "=" + cvalue + "; " + expires;
} 

// Takes a Page object and actually prints it to the
// screen.  Uses the global variable displayMode to
// decide whether we're making a portrait or landscape-style
// page.
function displayPage(pageObj) {
	console.log(pageObj)
	if(pageObj == false)
		console.log("Failed to load page.")
	else {
		$("#mainContent").empty();
		$("#mainContent").html(pageObj.getPortraitHTML());
		window.scrollTo(0, 0);
		
		// Set the header
		$("#pageLabel").html(pageObj.getLabel());

		// save place in cookie
		setCookie("chapter", astonishers.getCurrentChapterNumber(),30);
		setCookie("page", astonishers.getCurrentPageNumber(),30);
	}
}

$("#previousPage").click(function(event) {
	astonishers.getPreviousPage(displayPage);
});

$("#nextPage").click(function(event) {
	astonishers.getNextPage(displayPage);
});

$(document).keydown(function(e){
    if (e.keyCode == 37) {	// left arrow 
		astonishers.getPreviousPage(displayPage);
    }
	else if (e.keyCode == 39){
		astonishers.getNextPage(displayPage);
	}
});

$("#showNavBtn").click(function(event) {
	astonishers.getUserTOC($('#makecollapsible'), function() {$("#navPane").popup("open", {positionTo: "window"});});
});

$('#contentPane').on('pageinit', function() {
	// Immediately load page (without TOC)
	var hasValidCookie;
	var cookieChapter = getCookie("chapter");
	var cookiePage = getCookie("page");
	var suppressSplash = getCookie("suppressSplash");
	
	// Check if the cookie chapter/page is valid
	if(cookieChapter != "" && !isNaN(cookieChapter) && cookiePage != "" && !isNaN(cookiePage)) {
		console.log("Loading chapter " + cookieChapter + ", page " + cookiePage);
		astonishers = new Book(cookieChapter, cookiePage, displayPage);
		startChapter = cookieChapter;
		startPage = cookiePage;
		hasValidCookie = true;
	} else {
		console.log("No cookie.  We are starting at the beginning.");
		astonishers = new Book(0, 0, displayPage);
		hasValidCookie = false;
	}
	
});

