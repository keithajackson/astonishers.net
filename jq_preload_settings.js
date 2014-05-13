$(document).bind("mobileinit", function(){
  // Attempted fix for Chrome back-button bug (dialog specific)
  //$.mobile.pushStateEnabled = false;
  //$.mobile.ajaxEnabled = false;
 /* StackOverflow-sourced code to keep next and previous buttons from
		 getting stuck in the highlighted state.
		 http://stackoverflow.com/questions/1402698/binding-arrow-keys-in-js-jquery */

  $(document).on('tap', function(e) {
				$('.activeOnce').removeClass($.mobile.activeBtnClass);
  });
  /*$(function() {
			$('div[data-role="dialog"]').live('pagebeforeshow', function(e, ui) {
				ui.prevPage.addClass("ui-dialog-background ");
			});
			$('div[data-role="dialog"]').live('pagehide', function(e, ui) {
				$(".ui-dialog-background ").removeClass("ui-dialog-background ");
			});
		});*/
});