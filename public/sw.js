self.addEventListener("install", () => {
    self.skipWaiting();
});

self.addEventListener("fetch", () => {
    // simple pass-through
});
