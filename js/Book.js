/**
  * Book class
  * PURPOSE: Uses TableOfContents and Page classes to manage navigation through
  *			 chapters of the Tumblr webcomic.  All method calls to the Book object
  *			 for thisChapter.pages are asynchronous; the provided callback function is called
  *			 with a single parameter upon completion: the Page object requested or
  *			 the boolean value "false" if there was an error.
  * INPUTS :
  *			 startingChapter, startingPage: Chapter/page indices to quick-load
  *											before the Table of Contents has
  *											finished constructing.
  *			 initPageHandler: The function that will handle the Page object returned
  *							  by the function.
  * PROPERTIES : none
  * FUNCTIONS :
  *			 jumpTo: Load an arbitrary chapter/page
  *			 getPage: Load an arbitrary page in the current chapter
  *			 getCurrentPage: Get the most recently requested page
  *			 getPreviousPage: Get the page before the current page
  *			 getNextPage: Get the page after the current page
  *			 getCurrentChapterIndex: Get the loaded chapter index
  *			 getCurrentPageIndex: Get the current page inded
  *			 loadNavTOC: Prepare the UI navigation menu using the dynamically-
  *						 generated TOC, once it has finished constructing.
  * REQUIRES: Page.js, TableOfContents.js
  */
function Book(startingChapter, startingPage, initPageHandler) {
	// PRIVATE VARIABLES
	var self = this;

	// Struct for current chapter information
	var thisChapter = {
		pages:new Array(),
		index:-1,
		currentIndex:-1
	}

	var toc;	// Table of Contents for this Book
	var isNavRendered = false;	// True if the popup navigation menu is ready to view
	var isLoadingChapter = false;	// True if the thisChapter struct is being
									// modified (and is thus invalid)

	// PRIVATE METHODS

	// Load a new chapter from the Tumblr API via AJAX, replacing the current thisChapter
	// struct if successful. Runs recursively if the chapter is more than 20 pages long,
	// due to the limits of the Tumblr API.
	// INPUTS:
	//			chapterIx: The zero-based index of the chapter to attempt to fetch
	//			firstPageIx: The zero-based index of the page to start at (used for
	//				recursive call; to get the whole chapter set to 0).
	//			postLoadHandlerCallback: The parameterless function to call once
	//				the chapter has been loaded.
	// OUTPUT: Will call postLoadHandlerCallback with no parameters once the
	//		   chapter has finished loading.
	function loadChapterFromAjax(chapterIx, firstPageIx, postLoadHandlerCallback) {
		if (console) console.log("BOOK: Attempting to request chapter " + chapterIx + " (starting at page index " + firstPageIx + ") via AJAX.");

		// Make sure what we are assuming to be numbers are actually numbers
		chapterIx = Number(chapterIx);
		firstPageIx = Number(firstPageIx);

		// Generate the Tumblr tag to be used in the query
		var tumblrTag
		if(chapterIx == 0) {
			tumblrTag = "prologue";
		} else {
			tumblrTag = "chapter " + chapterIx;
		}

		$.ajax({
				url: "http://api.tumblr.com/v2/blog/astonishers.tumblr.com/posts?callback=?",
				data : ({
					api_key: 'BoJ3Xrg6F6oJA1T5TmK7bn387agH9oAwGV4FoMRBET2rSSYwYK',
					tag: tumblrTag,
					offset: firstPageIx,
				}),

				dataType: "jsonp",

				success: function (data) {

					// Generate chapter label
					var chapterLabel;
					if(chapterIx == 0) {
						chapterLabel = "Prologue";
					} else {
						chapterLabel = "Chapter " + chapterIx;
					}

					// Generate and push a page element into pages for every result found.
					var arrIndex = thisChapter.pages.length;
					for(var postIndex = data.response.posts.length - 1; postIndex >= 0; postIndex--) {
						var pageLabel = chapterLabel + ", Page " + (data.response.posts.length - Number(postIndex));
						thisChapter.pages.push(new Page(data.response.posts[postIndex], pageLabel));
						firstPageIx++;
					}

					if (console) console.log("BOOK: Chapter " + thisChapter.index + " now has " + thisChapter.pages.length + " pages.");

					// If there is a difference between the number of posts available (total_posts) and the number of posts we just
					// added to the array (firstPageIx), we need to call this function recursively and get the next batch.
					if((data.response.total_posts - firstPageIx) > 0) {
						if (console) console.log("BOOK: There are " + (data.response.total_posts - firstPageIx) + " pages left to load of a total of " + data.response.total_posts + ". Getting the next batch...");
						loadChapterFromAjax(chapterIx, firstPageIx, postLoadHandlerCallback);
					} else {
						// We've loaded all of the pages! Now to call our post-load handler...
						if (console) console.log("BOOK: We are done loading the array.  Now running the callback function...");
						if(postLoadHandlerCallback != null) {
							postLoadHandlerCallback();
						}
					}

				}
			})
	}

	// Internal method to load the first page of the next chapter
	// in the case that the user tries to navigate beyond the end of the
	// current chapter.
	// Will fall through (no callback) if a chapter load is currently happening
	// INPUTS:
	//			pageHandlerCallback: Callback method to take one parameter
	//			upon completion of chapter load.  Will return false if the
	//			load fails or return the first Page object of the next chapter.
	function loadNextChapter(pageHandlerCallback) {
		// Only attempt this when we are not already trying to load
		// a chapter (since chapter loading takes some time)
		if(isLoadingChapter == false) {
			toc.runWhenLoaded(function () {
				// Check if the desired chapter exists
				if(toc.hasChapter(Number(thisChapter.index) + 1)) {
					// It exists; fetch
					self.jumpTo(Number(thisChapter.index) + 1, 0, false, function () {
						pageHandlerCallback(thisChapter.pages[thisChapter.currentIndex]);
						return;
					});
				} else {
					// It does not exist; show error
					$.mobile.loading("show", {
						theme: "a",
						text: "This is the last page.",
						textVisible: true,
						textonly: true
					  });
					setTimeout(function() { $.mobile.loading("hide"); }, 1000);
					pageHandlerCallback(false);
					return;
				}
			});
		}
	}

	// Internal method to load the first page of the next chapter
	// in the case that the user tries to navigate before the beginning of the
	// current chapter.
	// Will fall through (no callback) if a chapter load is currently happening
	// INPUTS:
	//			pageHandlerCallback: Callback method to take one parameter
	//			upon completion of chapter load.  Will return false if the
	//			load fails or return the last Page object of the previous chapter.
	function loadPreviousChapter(pageHandlerCallback) {
		// Only attempt this when we are not already trying to load
		// a chapter (since chapter loading takes some time)
		if(isLoadingChapter == false) {
			toc.runWhenLoaded(function () {
				thisChapter.index = Number(thisChapter.index)
				// Check if the desired chapter exists
				if (console) console.log("BOOK: Attempting to load previous chapter:" + (thisChapter.index - 1));
				if(toc.hasChapter(thisChapter.index - 1)) {
					chNum = thisChapter.index - 1;
					pgNum = toc.getPageCount(thisChapter.index - 1) - 1
					// It exists; fetch
					self.jumpTo(chNum, pgNum, false, function() {
						pageHandlerCallback(thisChapter.pages[thisChapter.currentIndex]);
						return;
					});
				} else {
					// It does not exist; show error
					$.mobile.loading("show", {
						theme: "a",
						text: "This is the first page.",
						textVisible: true,
						textonly: true
					  });
					setTimeout(function() { $.mobile.loading("hide"); }, 1000);
					pageHandlerCallback(false);
					return;
				}
			});
		}
	}

	// PUBLIC METHODS

	// Jumps to an arbitrary chapter and page, showing a loading spinner
	// while doing so (just in case we have to make a long AJAX call).
	// If the jump fails, calls pageHandlerCallback with parameter false.
	// If the jump succeeds, calls pageHandlerCallback with the Page object
	// requested.
	// INPUTS:
	//			chapterIx: The zero-based index of the chapter to go to.
	//			pageIx: The zero-based index of the page to go to.
	//			ignoreTOC: If true, then jumpTo will not check if the page
	//				is out-of-bounds of the defined chapters/pages as given
	//				in the TOC.  This should be kept at "false" EXCEPT for
	//				the initial page load, which should be as quick as possible.
	//				Using the TOC will result in a "safe" jump, in which the
	//				current chapter/page is preserved if the jump is impossible.
	//			pageHandlerCallback: The function to call once jumpTo is done.
	//				Will be passed one parameter -- false if the jump failed or
	//				the desired Page object if the jump succeeded.
	this.jumpTo = function(chapterIx, pageIx, ignoreTOC, pageHandlerCallback) {
		isLoadingChapter = true;
		// Ensure our numbers are actually read as numbers
		chapterIx = Number(chapterIx);
		pageIx = Number(pageIx);

		// Set up a loading spinner if it's not already being used
		// Don't bother with the spinner if we're doing a quick-load
		//		(ignoreTOC)
		if(ignoreTOC == false && toc.isShowingSpinner() == false) {
			$.mobile.loading("show", {
					theme: "a",
					text: "One moment...",
					textVisible: true
				  });
		}

		// Gets chapter (via AJAX call if necessary) and
		// passes requested page to pageHandlerCallback.
		// Passes "false" if the call fails.
		// INPUTS:
		//			hasTOC: True if we can check the TOC to verify
		//				    the chapter/page is in range; false if
		//					we should load it blindly.
		var getChapter = function(hasTOC) {
			// If we have the TOC, save an AJAX call and see if we are out of range
			if(hasTOC) {
				// If the page is out of range, abort and report failure.
				if(thisChapter.index >= toc.getChapterCount()) {
					// This chapter does not exist. Immediately return as false
					if (console) console.log("BOOK: The chapter ID " + thisChapter.index + " is out of range of the toc " + toc.getChapterCount());
					// If the TOC isn't controlling the spinner, then we are and
					// we need to dismiss it
					if(toc.isShowingSpinner() == false) {
						 $.mobile.loading("hide");
					}
					isLoadingChapter = false;

					// Run callback with "false" to indicate failure
					pageHandlerCallback(false);
					return;
				}
			}

			// If the page is in range (or we're ignoring the TOC), proceed with the load.
			if (console) console.log("BOOK: Attempting to load chapter " + chapterIx + ", page " + pageIx);
			// Check if we currently have this chapter loaded.
			// If so, we don't need to do a costly AJAX call
			if(thisChapter.index == chapterIx) {
				// The chapter's already loaded!
				// If we turned on the spinner before, turn it off now.
				if(ignoreTOC == false && toc.isShowingSpinner() == false) {
							 $.mobile.loading("hide");
				}
				isLoadingChapter = false;

				// Pass on our callback to the getPage function with our
				// desired page.
				self.getPage(pageIx, pageHandlerCallback);
				return;
			} else {
				// We have to make an AJAX call to load this chapter.
				// Reset the chapter data to prepare for new chapter
				thisChapter.pages.length = 0;
				pageIx = Number(pageIx);
				thisChapter.index = chapterIx;
				thisChapter.currentIndex = pageIx;

				loadChapterFromAjax(thisChapter.index, 0, function() {
					// If we turned on the spinner before, turn it off now.
					if(ignoreTOC == false && toc.isShowingSpinner() == false) {
							 $.mobile.loading("hide");
					}
					isLoadingChapter = false;

					// Run page handler with the desired page.
					pageHandlerCallback(thisChapter.pages[Number(pageIx)]);
					return;
				});
			}
		}

		// Depending on whether we're ignoring the TOC or using it, we are
		// either going to run the above chapter-get function IMMEDIATELY
		// or place it in the queue to run once the TOC is constructed.
		if(ignoreTOC) {
			// ignore TOC and run
			getChapter(false);
		} else {
			// wait on TOC
			toc.runWhenLoaded(function () {return getChapter(true)});
		}
	}

	// Gets an arbitrary page in the current chapter.
	// Passes one parameter to the callback: false if
	// the page call failed, or the requested Page object
	// if it succeeded.
	// INPUTS:
	//		index: The zero-based index of the page to load
	//		pageHandlerCallback: The callback function that will handle the
	//			page being fetched (or false, if the fetch fails)
	this.getPage = function(index, pageHandlerCallback) {
		index = Number(index)
		if(index >= thisChapter.pages.length) {
			if (console) console.log("BOOK: Page out of range of this chapter.");
			pageHandlerCallback(false);
		} else {
			thisChapter.currentIndex = Number(index);
			pageHandlerCallback(thisChapter.pages[index]);
		}
	}

	// Gets the currently visited page in the current chapter.
	// This method is helpful if you need to re-load the page for
	// some reason and don't want to hit the cookie to figure out
	// where the reader is.
	// Passes one parameter to the callback: false if
	// the page call failed, or the requested Page object
	// if it succeeded.
	// INPUTS:
	//		pageHandlerCallback: The callback function that will handle the
	//			page being fetched (or false, if the fetch fails)
	this.getCurrentPage = function(pageHandlerCallback) {
		if(thisChapter.currentIndex >= thisChapter.pages.length || thisChapter.currentIndex < 0) {
			if (console) console.log("BOOK: Page out of range of this chapter.  Returning false.");
			pageHandlerCallback(false);
		} else {
			pageHandlerCallback(thisChapter.pages[thisChapter.currentIndex]);
		}
	}

	// Gets the page before the currently viewed page.  If this
	// is the first page of the chapter, will automatically try
	// to load the previous chapter and send back its last page.
	// If this is the first page of the book, a message will be
	// displayed to the user and the callback will receive "false".
	// Passes one parameter to the callback: false if
	// the page call failed (this is the first page of the book),
	// or the requested Page object if the call succeeded.
	// INPUTS:
	//		pageHandlerCallback: The callback function that will handle the
	//			page being fetched (or false, if the fetch fails)
	this.getPreviousPage = function(pageHandlerCallback) {
		toc.runWhenLoaded(function() {
			if(thisChapter.currentIndex - 1 < 0) {
				if (console) console.log("BOOK: Previous page out of range of this chapter.");
				// Try to fetch previous chapter
				loadPreviousChapter(pageHandlerCallback);
			} else {
				thisChapter.currentIndex--;
				pageHandlerCallback(thisChapter.pages[thisChapter.currentIndex]);
			}
		});
	}

	// Gets the page after the currently viewed page.  If this
	// is the last page of the chapter, will automatically try
	// to load the next chapter and send back its first page.
	// If this is the last page of the book, a message will be
	// displayed to the user and the callback will receive "false".
	// Passes one parameter to the callback: false if
	// the page call failed (this is the last page of the book),
	// or the requested Page object if the call succeeded.
	// INPUTS:
	//		pageHandlerCallback: The callback function that will handle the
	//			page being fetched (or false, if the fetch fails)
	this.getNextPage = function(pageHandlerCallback) {
		toc.runWhenLoaded(function () {
			if(thisChapter.currentIndex + 1 >= thisChapter.pages.length) {
				if (console) console.log("BOOK: Next page out of range of this chapter.");
				loadNextChapter(pageHandlerCallback);
			} else {
				thisChapter.currentIndex++;
				pageHandlerCallback(thisChapter.pages[thisChapter.currentIndex]);
			}
		});
	}

	// Returns the index of the currently-loaded chapter
	// (used for saving cookies)
	this.getCurrentChapterIndex = function() {
		return thisChapter.index;
	}

	// Returns the index of the currently-viewed page
	// (used for saving cookies)
	this.getCurrentPageIndex = function() {
		return thisChapter.currentIndex;
	}

	// Assembles the UI navigation based on the TOC.
	// Converts DOM element with ID "dynamicTOC" into
	// collapsible list with all chapters and pages in the
	// TOC.  Sets behaviors for all generated buttons as
	// well as the "firstPage" and "latestPage" quicklink
	// buttons.
	// INPUTS:
	//		userTOCReadyCallback: The method to call with
	//			no parameters once the NavTOC is ready to
	//			be viewed.
	// SOURCE:
	//		The collapsible-construction alogrithm used
	// 		here is based off StackOverflow username
	//		"Omar"'s template.
	//		Original conversation URL:
	//			http://stackoverflow.com/questions/18924079/dynamically-created-collapsible-set-in-jquery-mobile
	//		Adapted code (from linked JSFiddle demo):
	//			http://jsfiddle.net/Palestinian/zyEuB/
	this.loadNavTOC = function(userTOCReadyCallback) {
		toc.runWhenLoaded(function () {
			if(isNavRendered == false) {
				isNavRendered = true;
				$('#dynamicTOC').empty();
				$('#dynamicTOC')
				.append($('<div>')
				.attr({
				'data-role': 'collapsible-set',
					'id': 'toc'
				}));
				// Make collapsible ("drop-down") for each chapter
				for (i = 0; i < toc.getChapterCount(); i++) {
					var embHTML = ""; // We will build the list of buttons using this string

					// For each page in the given chapter
					for(var page = 0; page < toc.getPageCount(i); page++) {
						if (console) console.log("BOOK: Adding a page");
						// Append a button
						embHTML = embHTML + $('<div>').append(($('<a>')
							.attr({
								'data-role' : 'button',
								'chapterIx' : i,
								'pageIx': page,
							})
								.html("Page " + (Number(page) + 1)))).html();
					}

					// Build the chapter collapsible with embHTML for the
					// inner HTML
					var chapterString = "Chapter " + i;
					if (i == 0)
						chapterString = "Prologue";
					($('<div>')
						.attr({
						'data-role': 'collapsible',
						'id': 'collapse' + i,
							'data-content-theme': 'a',
							'data-collapsed': 'true'
					})
						.html('<h4>' + chapterString + '</h4>' + embHTML))
						.appendTo('#toc');
				}
				$('#dynamicTOC').collapsibleset().trigger('create');

				// Set button click behaviours

				// If user clicks on a page button, load that chapter/page
				$('#dynamicTOC div a[data-role="button"]').bind('click', function (event) {
					if (console) console.log("BOOK: Clicked a generated button!");
					if (console) console.log(this);
					var theChapter = Number(this.getAttribute("chapterIx"));
					var thePage = Number(this.getAttribute("pageix"));
					if (console) console.log("BOOK: Chapter: " + theChapter + ", page: " + thePage);
					if(typeof(theChapter) == "number" && typeof(thePage) == "number") {
						self.jumpTo(theChapter, thePage, false, displayPage);

						// dismiss the dialog
						$("#navPane").popup("close");
					}
					return;
				});

				// If the user clicks the "first page" quicklink, jump to first page
				$("#firstPage").click(function (event) {
					// jump to chapter 0, page 0
					self.jumpTo(0, 0, false, displayPage);

					// dismiss the dialog
					$("#navPane").popup("close");
					return;
				});

				// If the user clicks the "last page" quicklink, jump to last page
				$("#latestPage").click(function (event) {
					var lastChapter = toc.getChapterCount() - 1;
					var lastPage = toc.getPageCount(lastChapter) - 1
					self.jumpTo(lastChapter, lastPage, false, displayPage);

					// dismiss the dialog
					$("#navPane").popup("close");
					return;
				});
			} else {
				// Collapse all chapters before load
				for(var i = 0; i < toc.getChapterCount(); i++) {
					$('#collapse' + i).trigger('collapse').trigger('updatelayout');
				}
			}

			// Once the TOC is ready to view, run the callback
			// method.
			userTOCReadyCallback();
			return;
		});
	}

	// CONSTRUCTION/INITIALIZATOIN
	// Load the init chapter first, without the aid of the TOC
	self.jumpTo(startingChapter, startingPage, true, initPageHandler);
	// Create and construct the TOC for future calls.
	toc = new TableOfContents();
}
