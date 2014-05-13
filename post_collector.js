// API CALLS

function loadTableOfContents(targetArray, startingChapter, callbackFunction) {
	console.log("Attempting to get post count AJAX for a new chapter");
	var theTag;
	if(startingChapter == 0) {
		theTag = "prologue";
	} else {
		theTag = "chapter " + startingChapter;
	}
	$.ajax({
			url: "http://api.tumblr.com/v2/blog/astonishers.tumblr.com/posts?callback=?",
			data : ({
				api_key: 'BoJ3Xrg6F6oJA1T5TmK7bn387agH9oAwGV4FoMRBET2rSSYwYK',
				tag: theTag,
			}),

			dataType: "jsonp",

			success: function (data) {
				console.log("Got response attempting to read " + theTag);
				console.log(data);
				
				// If we have an empty response, we have finished the last chapter
				if(data.response.total_posts <= 0) {
					console.log("We are done loading the array.  Now running the callback function...");
					if(callbackFunction != null) {
						callbackFunction();
					}
				} else {
					// Store this chapter's page count
					targetArray.push(data.response.total_posts);
					console.log("There are more chapters to count.  Calling again...");
					// do a lookup for the next chapter
					startingChapter = Number(startingChapter) + 1;
					loadTableOfContents(targetArray, startingChapter, callbackFunction);
				}
				
			}
		})
}

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
	var landscapeIndex = 0;
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
				thisPhoto.setAttribute("class", "contentPhoto");		// was lazy
				thisPhoto.setAttribute("src", photoURLs[i]);
				photosetContainer.appendChild(thisPhoto);
				photosetContainer.appendChild(br.cloneNode(false));
			}
			
			return photosetContainer;
		}

		this.getLandscapeHTML = function() {
			var thisPhoto = document.createElement("img");
			thisPhoto.setAttribute("class", "contentPhoto");
			thisPhoto.setAttribute("src", photoURLs[landscapeIndex]);
				
			return thisPhoto;
		}
		
		// Returns false if we are already at the last page
		this.getNextLandscapeHTML = function() {
			if(landscapeIndex + 1 == photoURLs.length) {
				return false;
			} else {
				landscapeIndex++;
				return self.getLandscapeHTML();
			}
		}
		// Returns false if we are already at the first page
		this.getPreviousLandscapeHTML = function() {
			if(landscapeIndex - 1 < 0) {
				return false;
			} else {
				landscapeIndex--;
				return self.getLandscapeHTML();
			}
		}
		
		this.hasNextLandscapeHTML = function () {
			if(landscapeIndex + 1 == photoURLs.length) {
				return false;
			} else {
				return true
			}
		}
		
		this.hasPreviousLandscapeHTML = function () {
			if(landscapeIndex - 1 < 0) {
				return false;
			} else {
				return true;
			}
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
		
		this.getLandscapeHTML = function() {
			var thisPhoto = document.createElement("img");
			thisPhoto.setAttribute("class", "contentVideo");
			thisPhoto.innerHTML = embedCode;
				
			return thisPhoto;
		}
		
		//There's only ever one video, so this is false.
		this.getNextLandscapeHTML = function() {
			return false;
		}
		
		//There's only ever one video, so this is false.
		this.getPreviousLandscapeHTML = function() {
			return false;
		}
		
		this.hasNextLandscapeHTML = function () {
			return false;
		}
		
		this.hasPreviousLandscapeHTML = function () {
			return false;
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
		
		this.hasNextLandscapeHTML = function () {
			return false;
		}
		
		this.hasPreviousLandscapeHTML = function () {
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
	
	this.getPreviousPage = function() {
		if(currentPageIndex - 1 < 0) {
			console.log("Page out of range of this chapter.  Returning false.");
			return false;
		} else {
			currentPageIndex--;
			return(pages[currentPageIndex]);
		}
	}
	
	this.getNextPage = function() {
		if(currentPageIndex + 1 >= pages.length) {
			console.log("Page out of range of this chapter.  Returning false.");
			return false;
		} else {
			currentPageIndex++;
			return(pages[currentPageIndex]);
		}
	}
	
	this.getPage = function(index) {
		if(index >= pages.length) {
			console.log("Page out of range of this chapter.  Returning false.");
			return false;
		} else {
			currentPageIndex = Number(index);
			return(pages[index]);
		}
	}
	
	this.getCurrentPage = function() {
		if(currentPageIndex >= pages.length || currentPageIndex < 0) {
			console.log("Page out of range of this chapter.  Returning false.");
			return false;
		} else {
			return(pages[currentPageIndex]);
		}
	}
	
	this.getChapterNumber = function() {
		return chaptID;
	}
	this.getCurrentPageNumber = function() {
		return currentPageIndex;
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


/*
'Toast'-style notification
https://gist.github.com/kamranzafar/3136584
*/
var toast=function(msg){
	$("<div class='ui-loader ui-overlay-shadow ui-body-e ui-corner-all'><h3>"+msg+"</h3></div>")
		.css({ display: "block",
			opacity: 0.90,
			position: "fixed",
			padding: "7px",
			"text-align": "center",
			width: "270px",
			left: ($(window).width() - 284)/2,
			top: $(window).height()/2 })
		.appendTo( $.mobile.pageContainer ).delay( 1500 )
		.fadeOut( 400, function(){
			$(this).remove();
		});
}

// ------------------
// INSTANCE VARIABLES
// ------------------
var isDesktop;
var displayMode = "portrait";	// TODO: make this change dynamically
var currentChapter;
var latestChapter;
var DEFAULT_LATEST_CHAPTER = 1;
var LAST_PAGE_OF_THIS_CHAPTER = -1;
var DISPLAY_MODE_PORTRAIT = "portrait";
var DISPLAY_MODE_LANDSCAPE = "landscape";
var toc = new Array();
var isNavRendered = false;
var isTOCLoaded = false;
var isNavPopupWaiting = false;
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

function showNavDialog() {
	$("#navPane").popup("open");
	
}

function loadPage(pageIndex) {
	console.log("Attempting to load page: " + pageIndex);
	var thePage = currentChapter.getPage(pageIndex);
	
	if(thePage == false) {
		console.log("Could not load page.");
		return false;
	} else {
		console.log("Found page. Loading...");
		console.log(thePage);
		displayPage(thePage);
	}
}

// Get the next page, if it exists
function loadNextPage() {
	console.log("Attempting to load next page.");
	var thePage = currentChapter.getNextPage();
	
	if(thePage == false) {
		console.log("Reached the end of the chapter.  Loading next chapter...");
		loadNextChapter();
	} else {
		console.log("Found next page. Loading...");
		console.log(thePage);
		displayPage(thePage);
	}
}

// Get the previous page, if it exists
function loadPreviousPage() {
	var thePage = currentChapter.getPreviousPage();
	
	if(thePage == false) {
		loadPreviousChapter();
	} else {
		console.log("Found previous page. Loading...");
		console.log(thePage);
		displayPage(thePage);
	}
}

// AJAX callback.  Displays chapter if it exists.
function displayChapter(chapterObj, pageIndex, errorMsg) {
	console.log("Attempting to display page " + pageIndex +" of the chapter we just loaded.");
	// If the chapter we tried to load is invalid (out of range), we will get an object with zero pages.
	if(chapterObj.getPageCount() == 0) {
		toast(errorMsg);
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
// decide whether we're making a portrait or landscape-style
// page.
function displayPage(pageObj) {
	if(displayMode == DISPLAY_MODE_PORTRAIT) {
		$("#mainContent").empty();
		$("#mainContent").html(pageObj.getPortraitHTML());
		window.scrollTo(0, 0);
		/*$(function() {
			$("img.lazy").lazyload({
				threshold : 600
			});
		});*/
		// Change the header
		// get page,chapter
		var pageLabel;
		if(currentChapter.getChapterNumber() == 0) {
			pageLabel = "Prologue, "
		} else {
			pageLabel = "Chapter " + currentChapter.getChapterNumber() + ", ";
		}
		pageLabel = pageLabel + "Page " + (Number(currentChapter.getCurrentPageNumber()) + 1);
		$("#pageLabel").html(pageLabel);
	} else if (displayMode = DISPLAY_MODE_LANDSCAPE) {
		// This is only called when we are loading the first frame of a page
		 $("#mainContent").empty();
		 $("#mainContent").html(pageObj.getLandscapeHTML());
	} else {
		console.log("Could not resolve the display mode type for this page!");
	}
	// save place in cookie
	setCookie("chapter",currentChapter.getChapterNumber(),30);
	setCookie("page",currentChapter.getCurrentPageNumber(),30);
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

function loadNextImage() {
	// replace with previous frame if there is one
	if(currentChapter.getCurrentPage().hasNextLandscapeHTML() == true) {
		$("#mainContent").empty();
		$("#mainContent").html(currentChapter.getCurrentPage().getNextLandscapeHTML());
	} else {
		loadNextPage();
	}
}

function loadPreviousImage() {
	// replace with previous frame if there is one
	if(currentChapter.getCurrentPage().hasPreviousLandscapeHTML() == true) {
		$("#mainContent").empty();
		$("#mainContent").html(currentChapter.getCurrentPage().getPreviousLandscapeHTML());
	} else {
		loadPreviousPage();
	}
}

$("#navPane").on("popupbeforeposition", function(event) {
	if(isNavRendered == false) {
		isNavRendered = true;
		$('#makecollapsible').empty();
		$('#makecollapsible')
		.append($('<div>')
		.attr({
		'data-role': 'collapsible-set',
			'id': 'primary'
		}));
		for (i = 0; i < toc.length; i++) {
			var embHTML = "";
			for(var page = 0; page < toc[i]; page++) {
				console.log("Adding a page");
				embHTML = embHTML + $('<div>').append(($('<a>')
					.attr({
						'data-role' : 'button',
						'chapterNo' : i,
						'pageIx': page,
					})
						.html("Page " + (Number(page) + 1)))).html();
			}
			var chapterString = "Chapter " + i;
			if (i == 0)
				chapterString = "Prologue";
			($('<div>')
				.attr({
				'data-role': 'collapsible',
					'data-content-theme': 'c',
					'data-collapsed': 'true'
			})
				.html('<h4>' + chapterString + '</h4>' + embHTML))
				.appendTo('#primary');
		}
		$('#makecollapsible').collapsibleset().trigger('create');
		// set behaviors
		function killSplash() {
			$("#navPane").popup("close");
		}
		$('#makecollapsible div a[data-role="button"]').bind('click', function (event) {
			console.log("Clicked a generated button!");
			console.log(this);
			var theChapter = Number(this.getAttribute("chapterno"));
			var thePage = Number(this.getAttribute("pageix"));
			console.log("Chapter: " + theChapter + ", page: " + thePage);
			if(typeof(theChapter) == "number" && typeof(thePage) == "number") {
				loadChapter(theChapter, thePage);
				killSplash();
			}
		});
		$("#firstPage").click(function (event) {
			// jump to prologue;
			loadChapter(0, 0);
			killSplash();
		});

		$("#latestPage").click(function (event) {
			loadChapter(latestChapter, LAST_PAGE_OF_THIS_CHAPTER);
			killSplash();
		});
	}
});

$("#nextPage").click(function(event) {
	if(displayMode == DISPLAY_MODE_LANDSCAPE)
		loadNextImage();
	else
		loadNextPage();
});

$("#previousPage").click(function(event) {
	if(displayMode == DISPLAY_MODE_LANDSCAPE)
		loadPreviousImage();
	else
		loadPreviousPage();
});

$("#showNavBtn").click(function(event) {
	if(isTOCLoaded == false) {
		isNavPopupWaiting = true;
		$.mobile.loading("show", {
            theme: "b",
            text: "One moment...",
            textVisible: true
          });
	} else {
		$("#navPane").popup("open", {positionTo: "window"});
	}
});

$(document).keydown(function(e){
    if (e.keyCode == 37) {	// left arrow 
       	if(displayMode == DISPLAY_MODE_LANDSCAPE)
			loadPreviousImage();
		else
			loadPreviousPage();
    }
	else if (e.keyCode == 39){
		if(displayMode == DISPLAY_MODE_LANDSCAPE)
			loadNextImage();
		else
			loadNextPage();
	}
});

$(function(){
	$( "img" ).on( "swipeleft", function(event) {
		if(displayMode == DISPLAY_MODE_LANDSCAPE)
			loadNextImage();
	});
	$( "img" ).on( "swiperight", function(event) {
		if(displayMode == DISPLAY_MODE_LANDSCAPE)
			loadPreviousImage();
	});
});

/* JQuery: Populate the table as soon as the page is loaded. */
$('#contentPane').on('pageinit', function() {
	isDesktop = ($(window).width() > 700);
	// hide nav
	$('.ui-btn-right').closest('.ui-btn').hide();
	
	// Get latest chapter number and then display the splash/prompt
	getMostRecentAJAX(function(mostRecentPost) {
		var hasValidCookie;
		var cookieChapter = getCookie("chapter");
		var cookiePage = getCookie("page");
		var suppressSplash = getCookie("suppressSplash");
		if(cookieChapter != "" && !isNaN(cookieChapter) && cookiePage != "" && !isNaN(cookiePage) && (cookieChapter != 0 || cookiePage != 0)) {
			console.log("Loading chapter " + cookieChapter + ", page " + cookiePage);
			loadChapter(cookieChapter, cookiePage);
			startChapter = cookieChapter;
			startPage = cookiePage;
			hasValidCookie = true;
		} else { 
			// Do NOT update the URL in myLocation, as we want to show the splash again
			// if the user doesn't click on anything
			loadChapter(0, 0);
			console.log("No cookie.  We are starting at the beginning.");
			hasValidCookie = false;
		}
		latestChapter = DEFAULT_LATEST_CHAPTER;
		var latestPostDate = mostRecentPost.date.substr(0,10);
		// Figure out latest chapter from the tags of the post
		for(var i = 0; i < mostRecentPost.tags.length; i++) {
			if(mostRecentPost.tags[i].substr(0, 8)== "chapter ") {
				latestChapter = mostRecentPost.tags[i].substr(8);
				console.log("Found latest chapter is " + latestChapter + " from tags of most recent post.");
				break;
			}
		}
		// load nav
		
		loadTableOfContents(toc, 0, function() {
			isTOCLoaded = true;
			// if mobile loading thing is going on, dismiss and show the popup
			if(isNavPopupWaiting) {
				// dismiss loading thing
				$.mobile.loading("hide");
				// show popup
				$("#navPane").popup("open", {positionTo: "window"});
			}
		});
	});	
	
});

