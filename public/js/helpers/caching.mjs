export const data = function (req) {
  return new Promise(resolve => {
    caches.match(req)
    .then(async res => {
      if (res) resolve(await res.json());
      else {
        return await fetch(req)
        .then(res => {
          caches.open('CRD2.0')
          .then(async cache => {
            cache.put(req, res.clone())
            resolve(await res.json());
          });
        }).catch(err => console.log(err));
      }
    });
  });
}