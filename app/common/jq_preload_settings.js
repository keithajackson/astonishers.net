/**
  * JQuery Mobile Pre-Load settings file
  * PURPOSE: Tweaks to JQuery Mobile to optimize performance
  *			 for this site.
  */
$(document).bind("mobileinit", function(){

	/* StackOverflow-sourced code to keep next and previous buttons from
		 getting stuck in the highlighted state.  Makes all DOM elements
		 with the activeOnce tag not show the highlighted state.
		 Required for all the footer navigation buttons.
		 http://stackoverflow.com/questions/1402698/binding-arrow-keys-in-js-jquery */
  $(document).on('tap', function(e) {
				$('.activeOnce').removeClass($.mobile.activeBtnClass);
  });
});