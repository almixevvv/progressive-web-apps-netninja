const siteAsset = 'site-asset-v2';
const dynamicAsset = 'site-dynamic-v1';

const assets = [
  '/',
  'index.html',
  'js/app.js',
  'js/ui.js',
  'js/materialize.min.js',
  'css/custom.css',
  'css/materialize.min.css',
  'img/dish.png',
  'https://fonts.googleapis.com/icon?family=Material+Icons',
  'https://fonts.gstatic.com/s/materialicons/v47/flUhRq6tzZclQEJ-Vdg-IuiaDsNcIhQ8tQ.woff2',
  'pages/fallback.html'
];

//cache size limit function
const limitCacheSize = (name, size) => {

  //OPEN THE CACHE NAME, AND GET EVERY VALUE FROM IT
  caches.open(name).then(cache => {
    cache.keys().then(keys => {

      //CHECK IF THE LENGTH OF THE CACHE EXCEED THE LIMIT
      if(keys.length > size) {

        //RERUN THE FUNCTION, UNTILL THE CACHE SIZE IS PASSABLE
        cache.delete(keys[0]).then(limitCacheSize(name, size));
      }
    })
  })
};

// install event
self.addEventListener('install', evt => {
  //console.log('service worker installed');
  evt.waitUntil(
    caches.open(siteAsset)
    .then((cache) => {
      console.log('caching assets');
      cache.addAll(assets);
    })
  );
});

// activate event
self.addEventListener('activate', evt => {
  //console.log('service worker activated');

  evt.waitUntil(
    caches.keys().then(keys => {
      //console.log(keys);

      //RETURN THE PREVIOUS CACHE, AND KEEP THE CURRENT CACHE
      return Promise.all(keys
        .filter(key => key !== siteAsset && key !== dynamicAsset)
        .map(key => caches.delete(key))
      )
    })
  );

});

// fetch event
self.addEventListener('fetch', evt => {
  //console.log('fetch event', evt);

  evt.respondWith(
    caches.match(evt.request).then(cacheRes => {

      //IF THE PAGE IS OLD, GET FROM CACHE. IF IT'S NEW THEN ADD NEW CACHE
      return cacheRes || fetch(evt.request).then(fetchRes => {
        return caches.open(dynamicAsset).then(cache => {

          //PUT THE NEW PAGE TO CACHE AND DISPLAY THE CONTENT
          cache.put(evt.request.url, fetchRes.clone());
          limitCacheSize(dynamicAsset, 3);
          return fetchRes;
        })
      });
    }).catch(() => {
      //ONLY RETURN THE FALLBACK PAGES, IF THE USER REQUESTED A PAGE
      if(evt.request.url.indexOf('.html') > -1) {
          return caches.match('pages/fallback.html');
      }
    })

  );

});
