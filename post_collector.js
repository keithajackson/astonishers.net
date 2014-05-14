// API CALLS

function loadChapterFromAjax(tumblrTag, targetArray, startingIndex, callbackFunction) {
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
					loadChapterFromAjax(tumblrTag, targetArray, startingIndex, callbackFunction);
				} else {
					console.log("We are done loading the array.  Now running the callback function...");
					if(callbackFunction != null) {
						callbackFunction();
					}
				}
				
			}
		})
}

// -------
// CLASSES
// -------

// Page
// Accepts as constructor a JSON object from the Tumblr API
// and provides methods to load, insert, and remove the page
// loadImmediately: If true, will blindly try to get a page,
// rather than waiting on the table of contents. Only use
// when getting the onload page.
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

function Chapter(chapterID, loadImmediately, callback) {
	var self = this;
	var pages = new Array();
	var chaptTag;
	var chaptID = Number(chapterID);
	var currentPageIndex = 0;	// index of the currently displayed page
	var onLoadCallback = callback;
	console.log("The callback on init:")
	console.log(onLoadCallback);
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
	// Ajax request to get this chapter
	// Called internally if the TOC is initialized
	// at the time that we are making the chapter
	// Called externally if we have to wait on the TOC
	this.getChapterFromAjax = function(hasTOC) {
		// If we have the TOC, save an AJAX call and see if we are out of range
		if(hasTOC) {
			if(toc.length >= chaptID) {
				// This chapter does not exist. Immediately return as empty
				console.log("This is the callback:");
				console.log(onLoadCallback);
				onLoadCallback(self);
			}
		}
		// If we don't have the TOC (or the page is in range), call AJAX to load.
		loadChapterFromAjax(chaptTag, pages, 0, function() {
			console.log("This is the callback:");
			console.log(onLoadCallback);
			onLoadCallback(self);
		});
	}

	if(loadImmediately) {
		// ignore TOC and fetch directly
		console.log("The callback on loadImmediately:")
		console.log(onLoadCallback);
		self.getChapterFromAjax(false);
	} else {
		// wait on TOC
		console.log("The callback waiting on TOC:")
		console.log(onLoadCallback);
		toc.runWhenLoaded(function () {return self.getChapterFromAjax(true)});
	}
	
}
		
function TableOfContents() {
	var self = this;
	var pageCountList = new Array();
	var isTOCLoaded = false;
	var waitingOnTOC = new Array();
	var isLoadingVisible = false;

	this.runWhenLoaded = function (funcToCall) {
		// If the TOC is already loaded, just do the call
		if(isTOCLoaded) {
			funcToCall();
		} else {
			console.log("Waiting for TOC...")
			// If the TOC is loading,
			// push this function into the waiting queue
			waitingOnTOC.push(funcToCall);
			// Show loading anim if it's not already on-screen
			if(isLoadingVisible == false) {
				isLoadingVisible = true;
				$.mobile.loading("show", {
					theme: "b",
					text: "One moment...",
					textVisible: true
				  });
			}
		}
	}
	// First-run load
	function tocLoadedCallback() {
		$.mobile.loading("hide");
		isLoadingVisible = false;
		isTOCLoaded = true;
		// If the user rushed for action(s), fulfill now
		for(var i = 0; i < waitingOnTOC.length; i++) {
			waitingOnTOC[i]();
		}
		waitingOnTOC.length = 0;
	}
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
			});
	}
	loadTableOfContents(pageCountList, 0, loadTableOfContents);
	tocLoadedCallback();
}

// ---------
// CONSTANTS
// ---------
var LAST_PAGE_OF_THIS_CHAPTER = -1;

// ------------------
// INSTANCE VARIABLES
// ------------------
var currentChapter;
var latestChapter;
var toc;
var isNavRendered = false;

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
		// Notify the user that the page could not be loaded
		toc.runWhenLoaded(function () {
			$.mobile.loading( 'show', {text: errorMsg, textonly: true });
			setTimeout(function() { $.mobile.loading("hide"); }, 300);
		});
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
	$("#mainContent").empty();
	$("#mainContent").html(pageObj.getPortraitHTML());
	window.scrollTo(0, 0);
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

	// save place in cookie
	setCookie("chapter",currentChapter.getChapterNumber(),30);
	setCookie("page",currentChapter.getCurrentPageNumber(),30);
}

function loadNextChapter() {
	new Chapter(currentChapter.getChapterNumber() + 1, false, function(newChapterObj) {displayChapter(newChapterObj, 0, "This is the last page.")});
}

function loadPreviousChapter() {
	new Chapter(currentChapter.getChapterNumber() - 1, false, function(newChapterObj) {displayChapter(newChapterObj, LAST_PAGE_OF_THIS_CHAPTER, "This is the first page.")});
}

function loadChapter(chapterIndex, pageIndex, loadImmediately) {
	console.log("Loading chapter " + pageIndex);
	new Chapter(chapterIndex, loadImmediately, function(newChapterObj) {displayChapter(newChapterObj, pageIndex, "Cannot load chapter " + chapterIndex + ", page " + pageIndex + ".")});
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
				loadChapter(theChapter, thePage, false);
				killSplash();
			}
		});
		$("#firstPage").click(function (event) {
			// jump to prologue;
			loadChapter(0, 0, false);
			killSplash();
		});

		$("#latestPage").click(function (event) {
			loadChapter(toc.length - 1, toc[toc.length - 1] - 1, false);
			killSplash();
		});
	}
});

$("#nextPage").click(function(event) {
	toc.runWhenLoaded(loadNextPage);
});

$("#previousPage").click(function(event) {
	toc.runWhenLoaded(loadPreviousPage);
});

$("#showNavBtn").click(function(event) {
	toc.runWhenLoaded(function () {$("#navPane").popup("open", {positionTo: "window"})});
});

$(document).keydown(function(e){
    if (e.keyCode == 37) {	// left arrow 
		toc.runWhenLoaded(loadPreviousPage);
    }
	else if (e.keyCode == 39){
		toc.runWhenLoaded(loadNextPage);
	}
});





$('#contentPane').on('pageinit', function() {
	toc = new TableOfContents();
	// Immediately load page (without TOC)
	var hasValidCookie;
	var cookieChapter = getCookie("chapter");
	var cookiePage = getCookie("page");
	var suppressSplash = getCookie("suppressSplash");
	
	// Check if the cookie chapter/page is valid
	if(cookieChapter != "" && !isNaN(cookieChapter) && cookiePage != "" && !isNaN(cookiePage)) {
		console.log("Loading chapter " + cookieChapter + ", page " + cookiePage);
		loadChapter(cookieChapter, cookiePage, true);
		startChapter = cookieChapter;
		startPage = cookiePage;
		hasValidCookie = true;
	} else {
		console.log("No cookie.  We are starting at the beginning.");
		loadChapter(0, 0, true);
		hasValidCookie = false;
	}
	
});

