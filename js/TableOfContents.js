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
					theme: "a",
					text: "One moment...",
					textVisible: true
				  });
			}
		}
	}
	// First-run load
	function tocLoadedCallback() {
		console.log("TOC is loaded!");
		if(isLoadingVisible) {
			$.mobile.loading("hide");
			isLoadingVisible = false;
		}
		isTOCLoaded = true;
		// If the user rushed for action(s), fulfill now
		for(var i = 0; i < waitingOnTOC.length; i++) {
			waitingOnTOC[i]();
		}
		waitingOnTOC.length = 0;
	}
	
	this.isShowingSpinner = function() {
		return isLoadingVisible;
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
	loadTableOfContents(pageCountList, 0, tocLoadedCallback);
	
	this.getLength = function() {
		return pageCountList.length;
	}
	
	this.getPageCount = function(chapterIx) {
		if(Number(chapterIx) < pageCountList.length && Number(chapterIx) >= 0) {
			return Number(pageCountList[Number(chapterIx)]);
		} else {
			return false;
		}
	}
	
	this.hasChapter = function(chapterIndex) {
		return (Number(chapterIndex) < pageCountList.length && Number(chapterIndex) >= 0)
	}
}