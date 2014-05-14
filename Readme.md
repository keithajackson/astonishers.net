ASTONISHERS - MOBILE WEBSITE
========

URL: http://www.astonishers.net
--------------
INSTRUCTIONS
--------------
Unzip this archive to any folder (does not need to be on a server) so that index.html is in the root directory, all JavaScript (.js) files are in the js/ subdirectory, and the CSS (.css) file is in the css/ directory.  Open index.html to view and use the site.

REFLECTION/DESIGN METHODOLOGY
--------------
This project heavily focuses on prefetch-oriented asynchronous programming for the sake of minimizing wait time due to AJAX asynchronous calls.  The first few iterations of the project were based largely upon event-driven, synchronous programming methodologies: most of the functions to fetch and retrieve data only used an asynchronous call at the very end to handle the result of an AJAX request for a page from Tumblr.  To write synchronously, I had to make a very large number of AJAX calls, which greatly degraded the user experience of the site, as each call could take between a half a second and two seconds to complete.

When I went to try to optimize my code, I realized that in order to create the fastest, most efficient site, I needed to design my classes to accommodate a small number of calls for a large data set, rather than a large number of calls for small data sets.  Whereas in the original site I had an AJAX call for every page change, with the new system I was able to have a page call for every chapter change (every 3-17 pages), while individual page changes within a chapter were very inexpensive.

Another optimization that required me to think differently was the issue of reaching the first and the last pages of a chapter in the comic book.  In my initial design, if the user attempted to go past the last page in a chapter, the site would attempt to make an AJAX call for the next page in the current chapter, then, after failing that, would try to make an AJAX call for the next chapter.  In the worst case scenario, in which the user had actually already reached the first or last page, the user would have to wait for two AJAX requests to complete before knowing they had reached the end.

I had the idea of constructing a "table-of-contents" that would list the number of pages in each chapter to cut down on the number of AJAX failures when hitting chapter boundaries; rather than blindly trying to load a new page in the current chapter every time, the site instead could consult against the table of contents to determine whether it needed to pull a new chapter or inform the user that there were no pages left.  The problem I faced with this, however, was that the amount of time required to construct such a table of contents could take a massive number of AJAX requests.  If I waited to load any pages until the table of contents was built, there would be significant delay at the initial page load and site visitors might get frustrated at the load time.  Thus, I had to develop a compromise; the very first page would be loaded "blindly", without checking the table-of-contents for validity, and the table-of-contents would then be built in the background after the first page was displayed.  This cut down on the perceived lag on first load, as the user would see content very quickly, while also providing a generally enhanced browsing experience as the user navigated between other chapters and pages with the aid of the table of contents.  This kind of "half-and-half" design was not something I am used to implementing, but the challenge of having a dynamic content source and needing to have a quick page load provided a great opportunity to explore a combined approach.

Known Issues
--------------
The biggest issue with this site is occasional bugginess with Google Chrome -- JQuery Mobile's history-dependent navigation doesn't play along well with Chrome, and in order to eliminate the problem completely I would essentially need to override JQM's navigation system so it never changes the URL.  I've spent considerable time trying to do this in an earlier version that used dialogs rather than popups, but unless I can find a way to unbind and override all $(popup).close() methods, the dependence on History and the Chrome weirdness will continue.

Roadmap
--------------

There are several features yet to be implemented in this site, as well as optimizations to be made now that the code is stable:

*Optimizations*
- Generalize the "Book" and "TableOfContents" classes in terms of API/AJAX calls, so that an instantiation preference in the client JS (in this case, js/astonishers.js) can set the blog, API key, chapter-to-tag conversion, and more.
- Pull out the UI-generation method from "Book" and put it into the client JS.  I am not sure whether it would be best to simply return the ToC array to the client or actually provide a for-each style method where the user can specify a function to be applied to each chapter and/or page in the ToC.
- Completely disconnect the Pages, TableOfContents, and Book classes from JQuery Mobile.  These methods shouldn't need to use any JQM-specific features, and by removing them we can more easily port to another (hopefully more snappy) platform in the future.
*Features*
- Add support for static linking via address-bar variables.  This was implemented in the pre-JQM commits, but was removed because JQM takes over the address bar for its navigation.  I'm not sure whether there are conflicts now between JQM and this old code, but if not, it should be put back in and enabled so that the site is more "shareable"
- Add social media sharing options.  Speaking of "shareable", a "Share On..." would be a great feature if added as a non-obtrusive button (maybe in the header?).