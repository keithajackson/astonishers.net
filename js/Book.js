// Any callback call to Book returns a page.
function Book(startingChapter, startingPage, initDisplayCallback) {
	/* Eventually change to this:
	var thisChapter = {
		this.pages = new Array();
		this.tag = "";
		this.label = "";
		this.id = "";
		this.currentIndex = "";
	} */
	var toc;
	var self = this;
	var pages = new Array();
	var chaptTag;
	var chaptLabel;
	var chaptID;
	var currentPageIndex;
	var isNavRendered = false;
	var isLoadingChapter = false;
	function loadChapterFromAjax(chapterNo, targetArray, startingIndex, callbackFunction) {
		console.log("Attempting to poll AJAX for a chapter");
		var tumblrTag
		if(chapterNo == 0) {
			tumblrTag = "prologue";
		} else {
			tumblrTag = "chapter " + chapterNo;
		}
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
					
					// Generate page label
					var chaptLabel;
					if(chapterNo == 0) {
						chaptLabel = "Prologue";
					} else {
						chaptLabel = "Chapter " + chapterNo;
					}
					var arrIndex = targetArray.length;
					for(var postIndex = data.response.posts.length - 1; postIndex >= 0; postIndex--) {
						var pageLabel = chaptLabel + ", Page " + (data.response.posts.length - Number(postIndex));
						targetArray.push(new Page(data.response.posts[postIndex], pageLabel));
						startingIndex++;
					}
					
					console.log("The page array now has " + targetArray.length + " pages.");
					if((data.response.total_posts - startingIndex) > 0) {
						console.log("There are " + (data.response.total_posts - startingIndex) + " pages left to load of a total of " + data.response.total_posts + ". Calling again...");
						loadChapterFromAjax(chapterNo, targetArray, startingIndex, callbackFunction);
					} else {
						console.log("We are done loading the array.  Now running the callback function...");
						if(callbackFunction != null) {
							callbackFunction();
						}
					}
					
				}
			})
	}
	this.jumpTo = function(chapterID, pageID, loadImmediately, displayCallback) {
		isLoadingChapter = true;
		// Set up a loading spinner if it's not already being used
		if(loadImmediately == false && toc.isShowingSpinner() == false) {
			$.mobile.loading("show", {
					theme: "a",
					text: "One moment...",
					textVisible: true
				  });
		}
		pages.length = 0;
		pageID = Number(pageID);
		chaptID = Number(chapterID);
		currentPageIndex = Number(pageID);
		// Ajax request to get this chapter
		// Called internally if the TOC is initialized
		// at the time that we are making the chapter
		// Called externally if we have to wait on the TOC
		var getChapter = function(hasTOC) {
			// If we have the TOC, save an AJAX call and see if we are out of range
			if(hasTOC) {
				if(chaptID >= toc.getLength()) {
					// This chapter does not exist. Immediately return as false
					console.log("The chapter ID " + chaptID + " is out of range of the toc " + toc.getLength());
					console.log("This is the callback:");
					console.log(displayCallback);
					if(toc.isShowingSpinner() == false) {
						 $.mobile.loading("hide");
					}
					isLoadingChapter = false;
					displayCallback(false);
				}
			}
			console.log("Attempting to load chapter " + chaptID);
			// If we don't have the TOC (or the page is in range), call AJAX to load.
			loadChapterFromAjax(chaptID, pages, 0, function() {
				console.log("This is the callback:");
				console.log(displayCallback);
				console.log("Page " + pageID + ":");
				console.log(pages[Number(pageID)]);
				if(hasTOC && toc.isShowingSpinner() == false) {
						 $.mobile.loading("hide");
				}
				isLoadingChapter = false;
				displayCallback(pages[Number(pageID)]);
			});
		}

		if(loadImmediately) {
			// ignore TOC and fetch directly
			getChapter(false);
		} else {
			// wait on TOC
			toc.runWhenLoaded(function () {return getChapter(true)});
		}
	}
	function loadNextChapter(displayCallback) {
		// Only attempt this when we are not already trying to load
		// a chapter (since chapter loading takes some time)
		if(isLoadingChapter == false) {
			toc.runWhenLoaded(function () {
				// Check if the desired chapter exists
				if(toc.hasChapter(Number(chaptID) + 1)) {
					// It exists; fetch
					self.jumpTo(Number(chaptID) + 1, 0, false, function () {
						displayCallback(pages[currentPageIndex]);
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
				}
			});
		}
	}
	function loadPreviousChapter(displayCallback) {
		// Only attempt this when we are not already trying to load
		// a chapter (since chapter loading takes some time)
		if(isLoadingChapter == false) {
			toc.runWhenLoaded(function () {
				chaptID = Number(chaptID)
				// Check if the desired chapter exists
				console.log("Attempting to load previous chapter:");
				console.log(chaptID - 1);
				if(toc.hasChapter(chaptID - 1)) {
					chNum = chaptID - 1;
					pgNum = toc.getPageCount(chaptID - 1) - 1
					// It exists; fetch
					self.jumpTo(chNum, pgNum, false, function() {
						displayCallback(pages[currentPageIndex]);
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
				}
			});
		}
	}		
	this.getPage = function(index, displayCallback) {
		if(index >= pages.length) {
			console.log("Page out of range of this chapter.");
			displayCallback(false);
		} else {
			currentPageIndex = Number(index);
			displayCallback(pages[index]);
		}
	}	
	this.getCurrentPage = function(displayCallback) {
		if(currentPageIndex >= pages.length || currentPageIndex < 0) {
			console.log("Page out of range of this chapter.  Returning false.");
			displayCallback(false);
		} else {
			displayCallback(pages[currentPageIndex]);
		}
	}	
	this.getPreviousPage = function(displayCallback) {
		toc.runWhenLoaded(function() {
			if(currentPageIndex - 1 < 0) {
				console.log("Previous page out of range of this chapter.");
				// Try to fetch previous chapter
				loadPreviousChapter(displayCallback);
			} else {
				currentPageIndex--;
				displayCallback(pages[currentPageIndex]);
			}
		});
	}	
	this.getNextPage = function(displayCallback) {
		toc.runWhenLoaded(function () {
			if(currentPageIndex + 1 >= pages.length) {
				console.log("Next page out of range of this chapter.");
				loadNextChapter(displayCallback);
			} else {
				currentPageIndex++;
				displayCallback(pages[currentPageIndex]);
			}
		});
	}
	
	
	this.getCurrentChapterNumber = function() {
		return chaptID;
	}
	this.getCurrentPageNumber = function() {
		return currentPageIndex;
	}
	this.getUserTOC = function(hostDiv, displayCallback) {
		toc.runWhenLoaded(function () {
			if(isNavRendered == false) {
				isNavRendered = true;
				hostDiv.empty();
				hostDiv
				.append($('<div>')
				.attr({
				'data-role': 'collapsible-set',
					'id': 'primary'
				}));
				for (i = 0; i < toc.getLength(); i++) {
					var embHTML = "";
					for(var page = 0; page < toc.getPageCount(i); page++) {
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
						'id': 'collapse' + i,
							'data-content-theme': 'a',
							'data-collapsed': 'true'
					})
						.html('<h4>' + chapterString + '</h4>' + embHTML))
						.appendTo('#primary');
				}
				hostDiv.collapsibleset().trigger('create');
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
						self.jumpTo(theChapter, thePage, false, displayPage);
						killSplash();
					}
				});
				$("#firstPage").click(function (event) {
					// jump to prologue;
					self.jumpTo(0, 0, false, displayPage);
					killSplash();
				});

				$("#latestPage").click(function (event) {
					var lastChapter = toc.getLength() - 1;
					var lastPage = toc.getPageCount(lastChapter) - 1
					self.jumpTo(lastChapter, lastPage, false, displayPage);
					killSplash();
				});
			} else {
				// Collapse all chapters before load
				for(var i = 0; i < toc.getLength(); i++) {
					$('#collapse' + i).trigger('collapse').trigger('updatelayout');
				}
			}
			displayCallback();
		});
	}
	
	// Do initialization
	self.jumpTo(startingChapter, startingPage, true, initDisplayCallback);
	toc = new TableOfContents();
}