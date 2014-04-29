// -------
// CLASSES
// -------

// Page
// Accepts as constructor a JSON object from the Tumblr API
// and provides methods to load, insert, and remove the page
function Page(postData) {
	var self=this;
	this.id = postData.id;
	var type = postData.type;
	// Different behaviour if we have a video or photo postData
	if(postData.type == "photo") {
		var photoURLs = new Array();
		// Load photo array with ONLY urls, nothing else
		for (var i = 0; i < postData.photos.length; i++) {
			photoURLs[i] = postData.photos[i].original_size.url;
		}
		
		this.getHTML = function () {
			var photosetContainer = document.createElement("div");
			photosetContainer.setAttribute("class", "contentPage");
			photosetContainer.setAttribute("id", self.id);
			var br = document.createElement("br");
			// Add each photo to the set
			for(var i = 0; i < photoURLs.length; i++) {
				var thisPhoto = document.createElement("img");
				thisPhoto.setAttribute("class", "contentPhoto");
				thisPhoto.setAttribute("src", photoURLs[i]);
				photosetContainer.appendChild(thisPhoto);
				photosetContainer.appendChild(br.cloneNode(false));
			}
			
			return photosetContainer;
		}
	} else if (postData.type == "video") {
		var embedCode = postData.player[0].embed_code;
		
		this.getHTML = function () {
			var videoEmbed = document.createElement("div");
			videoEmbed.setAttribute("class", "contentPage");
			videoEmbed.setAttribute("id", self.id);
			videoEmbed.innerHTML = embedCode;
			return videoEmbed;
		}
	} else {
		console.log("Cannot determine the type of this post!");
		
		this.getHTML = function () {
			var emptyThing = document.createElement("div");
			emptyThing.setAttribute("class", "contentPage");
			emptyThing.setAttribute("id", self.id);
			return emptyThing;
		};
	}
	this.kill = function() {
		document.body.removeChild(document.getElementById(self.id));
	}
}

// LocationInfo (singleton)
// Contains the current chapter and page, the user is on,
// and can return the tags to search for with
function LocationInfo(thisChapter, thisPage) {
	var self=this;
	var chapter = thisChapter;
	var page = thisPage;
	
	this.changeLocation = function(newChapter, newPage, updateURL) {
		// Change variable values
		chapter = newChapter;
		page = newPage;
		// Change URL
		if(updateURL == true) {
			history.replaceState(null, "chapter " + newChapter + " page " + newPage,
				"?chapter=" + newChapter + "&page=" + newPage);
		}
	}
	this.getChapterQuery = function() {
		// convert "chapter 0" to prologue
		if(chapter == 0) {
			return "prologue";
		} else {
			return "chapter " + self.chapter;
		}
	};
	
	this.getPageQuery = function() {
		return self.page;
	};
}

// SplashScreen
// Contains methods to build and destroy a splash overlay
function showSplash() {
	// build layout
	var overlay = document.createElement("div");
	overlay.setAttribute("class", "overlay");
	overlay.setAttribute("id", "overlay");
	
	var frame = document.createElement("div");
	frame.setAttribute("class", "splashbox");
	frame.setAttribute("id", "splashbox");
	
	var titlePrefix = document.createElement("div");
	titlePrefix.innerHTML = "Welcome to";
	
	var titleMain = document.createElement("div");
	titleMain.innerHTML = "ASTONISHERS";
	
	var titlePostfix = document.createElement("div");
	titlePostfix.innerHTML = "THE ANIMATED WEBCOMIC";
	
	var startBeginningButton = document.createElement("button");
	startBeginningButton.setAttribute("id", "startFromBeginning");
	startBeginningButton.innerHTML = "Start Reading";
	
	var startLatestButton = document.createElement("button");
	startLatestButton.setAttribute("id", "startFromLatest");
	startLatestButton.innerHTML = "Newest Page";
	
	var br = document.createElement("br");
	
	frame.appendChild(titlePrefix);
	frame.appendChild(br.cloneNode(false));
	frame.appendChild(titleMain);
	frame.appendChild(br.cloneNode(false));
	frame.appendChild(titlePostfix);
	frame.appendChild(br.cloneNode(false));
	frame.appendChild(startBeginningButton);
	frame.appendChild(br.cloneNode(false));
	frame.appendChild(startLatestButton);
	document.body.appendChild(overlay);
	document.body.appendChild(frame);
	// set behaviors
	$("#startFromBeginning").click(function (event) {
		// save page location to history
		myLocation.changeLocation(currentChapter, currentPage, true);
		// kill splash
		document.body.removeChild(document.getElementById("splashbox"));
	document.body.removeChild(document.getElementById("overlay"));
	});
	$("#startFromLatest").click(function (event) {
		// get latest page and chapter number
		// currentPage = ?
		// currentChapter = ?
		$.ajax({
		url: "http://api.tumblr.com/v2/blog/astonishers.tumblr.com/posts/photo?callback=?",
		data : ({
			api_key: 'BoJ3Xrg6F6oJA1T5TmK7bn387agH9oAwGV4FoMRBET2rSSYwYK',
			tag: "astonishers update",
		}),

		dataType: "jsonp",

		success: function (data) {
			console.log("Response from JSON!");
			console.log(data);
			// TODO: This is a hacky way to get the
			// latest chapter...fix?
			currentChapter = latestChapter;
			// Get correct page number
			currentPage = 1;			
			for(var i = 1; i < data.response.posts.length; i++) {
				if ($.inArray("chapter " + latestChapter), data.response.posts[i].tags) {
					currentPage++;
				}
			}
			console.log("Loading page " + currentPage +
			 " (offset of 0 in the list of " + data.response.posts.length + " pages)");
			thisPage.kill();
			thisPage = new Page(data.response.posts[0]);
			
			document.body.appendChild(thisPage.getHTML());
			// save page location to history
			// kill the splash
			myLocation.changeLocation(currentChapter, currentPage, true);
			// delete current data in the window
			// populate screen with info
			// kill the splash
			document.body.removeChild(document.getElementById("splashbox"));
			document.body.removeChild(document.getElementById("overlay"));
		}
	})
		
	});
}

// ------------------
// INSTANCE VARIABLES
// ------------------
var isDesktop;
var showSplash;
var myLocation;
var thisPage;
var latestChapter = 1;

/* Swap out the URL when scrolling to a certain point */
/*$(document).scroll(function () {
	
}*/

// from http://css-tricks.com/snippets/javascript/get-url-variables/
function getQueryVariable(variable)
{
       var query = window.location.search.substring(1);
       var vars = query.split("&");
       for (var i=0;i<vars.length;i++) {
               var pair = vars[i].split("=");
               if(pair[0] == variable){return pair[1];}
       }
       return(null);
}

$("#changeChapter").click(function (event) {
	console.log("Changed chapter!");
	myLocation.changeLocation(0, 1);
});

/* JQuery: Populate the table as soon as the page is loaded. */
$(document).ready(function () {

	currentChapter = getQueryVariable("chapter");
	currentPage = getQueryVariable("page");
	console.log("Loading chapter " + currentChapter + " page " + currentPage);
	
	// make and load LocationInfo object
	myLocation = new LocationInfo(currentChapter, currentPage);
    
	
	// If we have no chapter, then show the splash and start at the beginning
	if(currentChapter == null) {
		// TODO: When we implement a saved-state cookie,
		// we should check to see if a cookie is stored with
		// the current location and restore it/suppress the
		// splash screen if found.
		// OR: add a "pick up where I left off"?
		
		currentChapter = 0;
		currentPage = 1;
		// Do NOT update the URL in myLocation, as we want to show the splash again
		// if the user doesn't click on anything
		myLocation.changeLocation(currentChapter, currentPage, false);
		showSplash();
	}
	// If we have no page, then start at the first page of that chapter
	else if (currentPage == null) {
		currentPage = 1;
		myLocation.changeLocation(currentChapter, currentPage, true);
	}
	isDesktop = ($(window).width() > 700);
	console.log("Just loaded chapter " + getQueryVariable("chapter") + ", page " + getQueryVariable("page"));
	// Load the page 
	$.ajax({
		url: "http://api.tumblr.com/v2/blog/astonishers.tumblr.com/posts/photo?callback=?",
		data : ({
			api_key: 'BoJ3Xrg6F6oJA1T5TmK7bn387agH9oAwGV4FoMRBET2rSSYwYK',
			tag: myLocation.getChapterQuery(),
		}),

		dataType: "jsonp",

		success: function (data) {
			console.log("Response from JSON!");
			console.log(data);
			// Get correct page
			var offset = data.response.posts.length - (currentPage);
			// Make this the current page
			console.log("Loading page " + currentPage + " (offset of " + offset + 
				" in the list of " + data.response.posts.length + " pages)");
			thisPage = new Page(data.response.posts[offset]);
			document.body.appendChild(thisPage.getHTML());
		}
	})
});

