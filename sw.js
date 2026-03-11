importScripts("https://progressier.app/RMuvBXS4yQ0hC8vZUl2f/sw.js" );
self.addEventListener("install", function(event) {
  event.waitUntil(
    caches.open("ramadhan-cache").then(function(cache) {
      return cache.addAll([
        "index.html",
        "jadwal.html",
        "style.css",
        "script.js",
        "data.js",
        "alif.jpg", // Diperbaiki dari foto.jpg
        "foto.png"  // Tambahkan jika gambar ini digunakan sebagai icon PWA
      ]);
    })
  );
});
