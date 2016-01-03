/**
  * Page class
  * PURPOSE: A "page" represents a single Tumblr post's worth of either
  * 		 photo or video data.  Contains methods to format this data
  *			 for display on the website and fetch the page title.
  * INPUTS :
  *			 postData: The Tumblr JSON object containing the post information.
  *			 pageLabel: The "page title" that should be displayed in the header
  *						when this page is loaded.
  * PROPERTIES :
  * 		 id: the Tumblr-designated post id this page is based on
  * FUNCTIONS :
  *			 getLabel() - returns the page title as a string (format: "Chapter X, Page Y")
  *			 getElement() - returns the formatted DOM object for the page.
  *
  */
function Page(postData, pageLabel) {
	// PRIVATE VARIABLES
	var self=this;
	var label = pageLabel;
	var type = postData.type;
	var landscapeIndex = 0;
	
	// PUBLIC VARIABLES
	this.id = postData.id;
	
	// PUBLIC METHODS	
	// Returns the page title
	this.getLabel = function() { return label; }
	
	// Different method definitions are given depending on the post type
	if(type == "photo") {
		// Load photo array with ONLY the urls from the Tumblr post
		// data, nothing else
		var photoURLs = new Array();
		for (var i = 0; i < postData.photos.length; i++) {
			photoURLs[i] = postData.photos[i].original_size.url;
		}
		
		// Returns the DOM object for this page
		this.getElement = function () {
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

	} else if (type == "video") {
		// Only data we need from the Tumblr data is the embed HTML
		var embedCode = postData.player[0].embed_code;
		
		// Returns the DOM object for this page
		this.getElement = function () {
			var videoEmbed = document.createElement("div");
			videoEmbed.setAttribute("class", "contentPage");
			videoEmbed.setAttribute("id", self.id);
			videoEmbed.innerHTML = embedCode;
			return videoEmbed;
		}
		
	} else {
		console.log("PAGE: Cannot determine the type of this post!");
		
		// If the type is invalid, function is still defined (just returns
		//		an empty DOM object)
		this.getElement = function () {
			var emptyThing = document.createElement("div");
			emptyThing.setAttribute("class", "contentPage");
			emptyThing.setAttribute("id", self.id);
			return emptyThing;
		};
		
	}
}