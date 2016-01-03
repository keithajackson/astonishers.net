/**
  * TableOfContents class
  * PURPOSE: Constructs and provides access to a "table of contents" based on
  *			 the posts currently available on Tumblr.  Essential data structure is
  *			 an array representing the number of page elements under each chapter
  *			 tag.
  *			 Constructing the TOC is expensive (several recursive AJAX calls), so
  *			 methods that must query the TableOfContents should not attempt to access
  *			 it immediately, but rather should pass the function that needs access
  *			 to the TableOfContents to the method runWhenLoaded, which keeps a queue
  *			 of waiting functions and runs them all once the TOC has been constructed.
  * INPUTS : none
  * PROPERTIES : none
  * FUNCTIONS :
  *			 getLabel() - returns the page title as a string (format: "Chapter X, Page Y")
  *			 getElement() - returns the formatted DOM object for the page.
  *
  */
function TableOfContents() {
	// PRIVATE VARIABLES
	var self = this;
	var pageCountList = new Array();
	var isTOCLoaded = false;
	var waitingOnTOC = new Array();
	var isLoadingVisible = false;

	// PUBLIC METHODS
	// Queues a given TableOfContents-dependent function to run once
	// the table of contents has finished constructing.  Will display
	// a "Please wait" loading spinner to the user until construction
	// is done and the function can be run.
	// If the TableOfContents has already been constructed, runs the
	// given function immediately.
	this.runWhenLoaded = function (funcToCall) {
		// If the TOC is already loaded, just do the call
		if(isTOCLoaded) {
			funcToCall();
		} else {
			if (console) console.log("TOC: Waiting for TOC...")
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

	// Returns true if the TableOfContents is currently using
	// the $.mobile.loading() spinner to tell the user to wait.
	// If the TableOfContents is using the spinner, other methods
	// should not try to use it.
	this.isShowingSpinner = function() {
		return isLoadingVisible;
	}

	// Returns the number of chapters found.
	this.getChapterCount = function() {
		return pageCountList.length;
	}

	// Returns the number of pages for a chapter with a given
	// index; returns false if chapter number is out of range.
	this.getPageCount = function(chapterIx) {
		if(Number(chapterIx) < pageCountList.length && Number(chapterIx) >= 0) {
			return Number(pageCountList[Number(chapterIx)]);
		} else {
			return false;
		}
	}

	// Returns true if a chapter exists with the given index;
	// returns false if out of range.
	this.hasChapter = function(chapterIndex) {
		return (Number(chapterIndex) < pageCountList.length && Number(chapterIndex) >= 0)
	}

	// PRIVATE METHODS/CONSTRUCTOR

	// Callback to use once the AJAX calls/construction is done.
	// Hides the loading spinner if it is visible, runs any processes
	// queued by runWhenLoaded(), and marks the TOC as fully loaded.
	function tocLoadedCallback() {
		if (console) console.log("TOC: TOC is loaded!");
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

	// Recursive AJAX method that counts the number of pages in successive
	// chapters, starting at the given chapter index.  Used to construct
	// the table of contents.
	// INPUTS:
	//		startingChapter: The chapter index to start reading at (used
	//			to call recursively)
	// OUTPUT/ALGORITHM:
	//		Recursively requests and stores page counts in the pageCountList array
	//			until a chapter with 0 pages is reached, at which point tocLoadedCallback
	//			is run.
	function loadPageCount(startingChapter) {
		startingChapter = Number(startingChapter);
		if (console) console.log("TOC: Attempting to get post count AJAX for chapter " + startingChapter);

		// Generate Tumblr tag to use in AJAX call
		var theTag;
		if(startingChapter == 0) {
			// chapter 0 is tagged 'prologue'
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
					if (console) console.log("TOC: Got " + data.response.total_posts + " pages in " + theTag);

					// If we have an empty response, we have finished the last chapter
					if(data.response.total_posts <= 0) {
						if (console) console.log("TOC: We are done loading the TOC.  Now running the callback function...");
						tocLoadedCallback();
					} else {
						// Store this chapter's page count
						pageCountList.push(data.response.total_posts);
						// do a lookup for the next chapter
						startingChapter = Number(startingChapter) + 1;
						loadPageCount(startingChapter);
					}

				}
			});
	}

	// Load the table of contents by starting the recursive
	// page count function at index 0
	loadPageCount(pageCountList, 0, tocLoadedCallback);
}
