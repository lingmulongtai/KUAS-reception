// proxy script that loads the root script when served from /public
(function(){
	var s = document.createElement('script');
	s.src = '../script.js';
	s.defer = true;
	document.head.appendChild(s);
})();


