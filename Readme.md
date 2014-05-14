ASTONISHERS - MOBILE WEBSITE
========

URL: http://www.astonishers.net
--------------

Project Description
--------------
This is an animated webcomic reader for the comic "Astonishers" (http://astonishers.tumblr.com), which dynamically pulls all data from Tumblr's API to navigate through tagged posts and give it a "table of contents" driven structure on-the-fly.  The Tumblr blog that is used as the data source can mark a page as part of the comic by adding a tag (in this case, "astonishers update"), and it must use a second tag to indicate the "chapter" it should be included in (such as "chapter 1", "chapter 7", etc.)  Since Astonishers has a "Prologue" section that precedes Chapter 1, a request for "chapter 0" is converted to a request for the "prologue" tag.

The "client" file in JavaScript is "astonishers.js"  To access data from Tumblr, the client creates an instance of Book with a given chapter and page number as a starting point.  When requesting a next post's content from the Book, the client receives a Page object, whose getElement method will return a DOM object that can be injected into the body of the webpage.

Primary Features
--------------
- No index file or table of contents on the site to update or maintain (it is always generated dynamically)
- No need to tag Tumblr pages with individual page numbers (page numbers automatically calculated based off the number of posts tagged with a chapter number)
- Can source from a Tumblr blog that posts non-reader content by simply using a unique tag for everything that should be used by the reader.
- Cross-platform reading experience for mobile and desktop without a redirect to a "mobile version"
- Site cookie automatically "bookmarks" the user's place when they leave the page and recalls it when they return.
- Asynchronous design allows for quick first load and an overall responsive and smooth browsing experience.

Design Methodology
--------------
This project heavily focuses on prefetch-oriented asynchronous programming for the sake of minimizing wait time due to AJAX asynchronous calls.  In order to create the fastest, most efficient site, the Book/Page classes must use as few API calls as possible, fetching larger blocks of data, rather than a large number of calls for small data sets.  This is accomplished by fetching an entirechapter at a time (rather than a post at a time) and preparing all of the pages for rendering ahead of time.  This decreases the AJAX call rate from once per page to once per 3-20 pages, depending on the chapter size.

To provide the navigation that lets a user directly access any page and/or chapter, a "Table of Contents" object is built when the page first loads that can determine whether a particular chapter or page is in range without making an API call.  We use this object to construct the navigation menu and to check whether a page request is valid or invalid.  The ToC is also used to validate page load requests, returning an error if the page is out of range without making an API call.  This could be extended in the future to also prefetch chapters before the user needs them but is getting close to a chapter division (currently the most time-consuming operation).  This data structure is useful, but expensive to build; it may require several recursive AJAX calls to index every available tagged post.  The ToC-as-validator role allows us to have a very simple external interface to the Book; getNextPage, getPreviousPage, and jumpTo.  We do not need to worry if we are on the last or first page of the chapter externally; instead, the Book will check its ToC internally, and if a page-step has invalidated our location, we can try to change chapters.  If there are no more chapters, we can inform the user they've reached the start/end of the book without making a single AJAX call.

A compromise to maximize first-load speed is to load the inital page without validating it against the ToC, and then funnelling all other page requests through the ToC.  This compromise assumed that the user will spend at least a second or two on the first panel that loads before navigating, in which case the ToC loading will be essentially invisible.

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
- The availability of the ToC could easily be extended to allow us to actually **prefetch** chapters when we get close to the chapter borders, actually eliminating all loading screens for a common use case.

*Features*
- Add support for static linking via address-bar variables.  This was implemented in the pre-JQM commits, but was removed because JQM takes over the address bar for its navigation.  I'm not sure whether there are conflicts now between JQM and this old code, but if not, it should be put back in and enabled so that the site is more "shareable"
- Add social media sharing options.  Speaking of "shareable", a "Share On..." would be a great feature if added as a non-obtrusive button (maybe in the header?).