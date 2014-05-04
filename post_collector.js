// API CALLS


function loadPageArrayFromAJAX(tumblrTag, targetArray, startingIndex, callbackFunction) {
	console.log("Attempting to poll AJAX for a new chapter");
	$.ajax({
			url: "http://api.tumblr.com/v2/blog/astonishers.tumblr.com/posts?callback=?",
			data : ({
				api_key: 'BoJ3Xrg6F6oJA1T5TmK7bn387agH9oAwGV4FoMRBET2rSSYwYK',
				tag: tumblrTag,
				offset: startingIndex,
			}),

			dataType: "jsonp",

			success: function (data) {
				console.log("Got response attempting to read " + tumblrTag + " starting at index " + startingIndex);
				console.log(data);
				var arrIndex = targetArray.length;
				for(var postIndex = data.response.posts.length - 1; postIndex >= 0; postIndex--) {
					targetArray.push(new Page(data.response.posts[postIndex]));
					startingIndex++;
				}
				
				console.log("The page array now has " + targetArray.length + " pages.");
				if((data.response.total_posts - startingIndex) > 0) {
					console.log("There are " + (data.response.total_posts - startingIndex) + " pages left to load of a total of " + data.response.total_posts + ". Calling again...");
					loadPageArrayFromAJAX(tumblrTag, targetArray, startingIndex, callbackFunction);
				} else {
					console.log("We are done loading the array.  Now running the callback function...");
					if(callbackFunction != null) {
						callbackFunction();
					}
				}
				
			}
		})
}

function getMostRecentAJAX(callbackFunction) {
	$.ajax({
		url: "http://api.tumblr.com/v2/blog/astonishers.tumblr.com/posts?callback=?",
		data : ({
			api_key: 'BoJ3Xrg6F6oJA1T5TmK7bn387agH9oAwGV4FoMRBET2rSSYwYK',
			tag: "astonishers update",
			limit: 5,
		}),

		dataType: "jsonp",

		success: function (data) {
			callbackFunction(data.response.posts[0]);
		}
	})
}

// -------
// CLASSES
// -------

// Page
// Accepts as constructor a JSON object from the Tumblr API
// and provides methods to load, insert, and remove the page
function Page(postData) {
	var self=this;
	this.id = postData.id;
	this.type = postData.type;
	this.landscapeIndex = 0;
	// Different ` if we have a video or photo postData
	if(this.type == "photo") {
		var photoURLs = new Array();
		// Load photo array with ONLY urls, nothing else
		for (var i = 0; i < postData.photos.length; i++) {
			photoURLs[i] = postData.photos[i].original_size.url;
		}
		
		this.getPortraitHTML = function () {
			// reset landscape (since we've switched orientations
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
		// Returns false if we are already at the last page
		this.getNextLandscapeHTML = function() {
			if(landscapeIndex + 1 == photoURLs.length) {
				return false;
			} else {
				landscapeIndex++;
				return getLandscapeHTML();
			}
		}
		// Returns false if we are already at the first page
		this.getPreviousLandscapeHTML = function() {
			if(landscapeIndex - 1 < 0) {
				return false;
			} else {
				landscapeIndex--;
				return getLandscapeHTML();
			}
		}
		
		this.getLandscapeHTML = function() {
			var thisPhoto = document.createElement("img");
			thisPhoto.setAttribute("class", "contentPhoto");
			thisPhoto.setAttribute("src", photoURLs[landscapeIndex]);
				
			return thisPhoto;
		}
		
	} else if (this.type == "video") {
		var embedCode = postData.player[0].embed_code;
		
		this.getPortraitHTML = function () {
			var videoEmbed = document.createElement("div");
			videoEmbed.setAttribute("class", "contentPage");
			videoEmbed.setAttribute("id", self.id);
			videoEmbed.innerHTML = embedCode;
			return videoEmbed;
		}
		
		//There's only ever one video, so this is false.
		this.getNextLandscapeHTML = function() {
			return false;
		}
		
		//There's only ever one video, so this is false.
		this.getPreviousLandscapeHTML = function() {
			return false;
		}
		
		this.getLandscapeHTML = function() {
			var thisPhoto = document.createElement("img");
			thisPhoto.setAttribute("class", "contentVideo");
			thisPhoto.innerHTML = embedCode;
				
			return thisPhoto;
		}
		
	} else {
		console.log("Cannot determine the type of this post!");
		
		this.getPortraitHTML = function () {
			var emptyThing = document.createElement("div");
			emptyThing.setAttribute("class", "contentPage");
			emptyThing.setAttribute("id", self.id);
			return emptyThing;
		};
		
		this.getNextLandscapeHTML = function() {
			return false;
		}
		
		this.getPreviousLandscapeHTML = function() {
			return false;
		}
		
		this.getLandscapeHTML = function() {
			var emptyThing = document.createElement("div");
			emptyThing.setAttribute("class", "contentImage");
			emptyThing.setAttribute("id", self.id);
			// Maybe add an error image here?
			return emptyThing;
		}
		
	}
	this.kill = function() {
		document.body.removeChild(document.getElementById(self.id));
	}
}

function Chapter(chapterID, onLoadCallback) {
	var self = this;
	var pages = new Array();
	var chaptTag;
	var chaptID = Number(chapterID);
	var currentPageIndex = 0;	// index of the currently displayed page

	if(chapterID == 0) {
		chaptTag = "prologue";
	} else {
		chaptTag = "chapter " + chapterID;
	}
	// load the chapter via Tumblr API call.
	savePlaceInCookie = function() {
		setCookie("chapter",chaptID,30);
		setCookie("page",currentPageIndex,30);
	}
	this.getPreviousPage = function() {
		if(currentPageIndex - 1 < 0) {
			console.log("Page out of range of this chapter.  Returning false.");
			return false;
		} else {
			currentPageIndex--;
			savePlaceInCookie();
			return(pages[currentPageIndex]);
		}
	}
	
	this.getNextPage = function() {
		if(currentPageIndex + 1 >= pages.length) {
			console.log("Page out of range of this chapter.  Returning false.");
			return false;
		} else {
			currentPageIndex++;
			savePlaceInCookie();
			return(pages[currentPageIndex]);
		}
	}
	
	this.getPage = function(index) {
		if(index >= pages.length) {
			console.log("Page out of range of this chapter.  Returning false.");
			return false;
		} else {
			currentPageIndex = index;
			savePlaceInCookie();
			return(pages[index]);
		}
	}
	
	this.getChapterNumber = function() {
		return chaptID;
	}
	this.getPageCount = function() {
		return pages.length;
	}
	loadPageArrayFromAJAX(chaptTag, pages, 0, function() {
		console.log("Created chapter.  Attempting to load callback.");
		// Save the current chapter as a cookie
		console.log(self);
		onLoadCallback(self);
	});
}


// ------------------
// INSTANCE VARIABLES
// ------------------
var isDesktop;
var displayMode = "portrait";	// TODO: make this change dynamically
var showSplash;
var currentChapter;
var DEFAULT_LATEST_CHAPTER = 1;
var LAST_PAGE_OF_THIS_CHAPTER = -1;
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


// SplashScreen
// Contains methods to build and destroy a splash overlay
function showSplash(hasCookie, latestChapter) {
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

	var restartButton;
	
	var resumeButton = document.createElement("button");
	resumeButton.setAttribute("id", "resume");

	if(hasCookie == true) {
		restartButton = document.createElement("button");
		restartButton.setAttribute("id", "restart");
		restartButton.innerHTML = "Start Over";
		resumeButton.innerHTML = "Continue Reading";
	} else {
		resumeButton.innerHTML = "Start Reading";
	}
	
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
	
	if(hasCookie == true) {
		frame.appendChild(restartButton);
		frame.appendChild(br.cloneNode(false));
	}
	
	frame.appendChild(resumeButton);
	frame.appendChild(br.cloneNode(false));
	frame.appendChild(startLatestButton);
	document.body.appendChild(overlay);
	document.body.appendChild(frame);
	// set behaviors
	function killSplash() {
		if(document.getElementById("splashbox") != null)
			document.body.removeChild(document.getElementById("splashbox"));
		if(document.getElementById("overlay") != null)
			document.body.removeChild(document.getElementById("overlay"));
	}
	$("#resume").click(function (event) {
		killSplash();
	});
	$("#restart").click(function (event) {
		killSplash();
		// jump to prologue;
		loadChapter(0, 0);
	});
	$("#startFromLatest").click(function (event) {
		killSplash();
		loadChapter(latestChapter, LAST_PAGE_OF_THIS_CHAPTER);
	});
}

function loadPage(pageIndex) {
	console.log("Attempting to load page: " + pageIndex);
	var thePage = currentChapter.getPage(pageIndex);
	console.log(thePage);
	if(thePage == false) {
		console.log("Could not load page.");
		return false;
	} else {
		document.body.appendChild(thePage.getPortraitHTML());
	}
}

// Get the next page, if it exists
function loadNextPage() {
	console.log("Attempting to load next page.");
	var thePage = currentChapter.getNextPage();
	console.log(thePage);
	if(thePage == false) {
		console.log("Reached the end of the chapter.  Loading next chapter...");
		loadNextChapter();
	} else {
		console.log("Found new page. Loading...");
		document.body.appendChild(thePage.getPortraitHTML());
	}
}

// Get the previous page, if it exists
function loadPreviousPage() {
	var thePage = currentChapter.getPreviousPage();
	
	if(thePage == false) {
		loadPreviousChapter();
	} else {
		document.body.appendChild(thePage.getPortraitHTML());
	}
}

// AJAX callback.  Displays chapter if it exists.
function displayChapter(chapterObj, pageIndex, errorMsg) {
	console.log("Attempting to display page " + pageIndex +" of the chapter we just loaded.");
	// If the chapter we tried to load is invalid (out of range), we will get an object with zero pages.
	if(chapterObj.getPageCount() == 0) {
		console.log(errorMsg);
	} else {
		currentChapter = chapterObj;
		// check if this is supposed to load the last page of the chapter
		if(pageIndex == LAST_PAGE_OF_THIS_CHAPTER) {
			pageIndex = currentChapter.getPageCount() - 1;
			console.log("Attempting to load the LAST page of this chapter (" + pageIndex + ")");
		}
		// try to display page
		if(loadPage(pageIndex) == false) {
			// if it fails try the first page
			console.log("Failed to load the page at the given index; loading page 0.");
			loadPage(0);
		}
	}
	
}

// Takes a Page object and actually prints it to the
// screen.  Uses the global variable displayMode to
// decide whether we're making a portait or landscape-style
// page.
function displayPage(pageObj) {
	
}

function loadNextChapter() {
	new Chapter(currentChapter.getChapterNumber() + 1, function(newChapterObj) {displayChapter(newChapterObj, 0, "This is the last page.")});
}

function loadPreviousChapter() {
	new Chapter(currentChapter.getChapterNumber() - 1, function(newChapterObj) {displayChapter(newChapterObj, LAST_PAGE_OF_THIS_CHAPTER, "This is the first page.")});
}

function loadChapter(chapterIndex, pageIndex) {
	console.log("Loading chapter " + pageIndex);
	new Chapter(chapterIndex, function(newChapterObj) {displayChapter(newChapterObj, pageIndex, "Cannot load chapter " + chapterIndex + ", page " + pageIndex + ".")});
}

$("#nextPage").click(function(event) {
	loadNextPage();
});

$("#previousPage").click(function(event) {
	loadPreviousPage();
});

/* JQuery: Populate the table as soon as the page is loaded. */
$(document).ready(function () {
	isDesktop = ($(window).width() > 700);
	
	// Get latest chapter number and then display the splash/prompt
	getMostRecentAJAX(function(mostRecentPost) {
		var hasValidCookie;
		//var cookieChapter = getCookie("chapter");
		//var cookiePage = getCookie("page");
		/* -- CURRENTLY IGNORING THE COOKIES
		if(cookieChapter != "" && !isNaN(cookieChapter) && cookiePage != "" && !isNaN(cookiePage) && (cookieChapter != 0 || cookiePage != 0)) {
			console.log("Loading chapter " + cookieChapter + ", page " + cookiePage);
			loadChapter(cookieChapter, cookiePage);
			startChapter = cookieChapter;
			startPage = cookiePage;
			hasValidCookie = true;
		} else { */
			// Do NOT update the URL in myLocation, as we want to show the splash again
			// if the user doesn't click on anything
			loadChapter(0, 0);
			console.log("No cookie.  We are starting at the beginning.");
			hasValidCookie = false;
		//}
		var latestChapter = DEFAULT_LATEST_CHAPTER;
		// Figure out latest chapter from the tags of the post
		for(var i = 0; i < mostRecentPost.tags.length; i++) {
			if(mostRecentPost.tags[i].substr(0, 8)== "chapter ") {
				latestChapter = mostRecentPost.tags[i].substr(8);
				console.log("Found latest chapter is " + latestChapter + " from tags of most recent post.");
				break;
			}
		}
		
		showSplash(hasValidCookie, latestChapter);
	});
	
});

