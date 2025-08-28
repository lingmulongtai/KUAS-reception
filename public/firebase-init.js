// proxy to load root firebase-init.js when served from /public
(function(){
	var s = document.createElement('script');
	s.src = '../firebase-init.js';
	s.defer = true;
	document.head.appendChild(s);
})();


