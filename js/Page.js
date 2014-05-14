// Page
// Accepts as constructor a JSON object from the Tumblr API
// and a page label ("Chapter X, Page Y").
// Provides methods to load, insert, and remove the page
function Page(postData, pageLabel) {
	var self=this;
	var label = pageLabel;
	this.id = postData.id;
	this.type = postData.type;
	var landscapeIndex = 0;
	
	this.getLabel = function() { return label; }
	// Different if we have a video or photo postData
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