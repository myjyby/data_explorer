exports.getLocation = async function (req,s) {
  /*
  Try to detect location.
  */
  const get_url = new URL('detect', process.env.CRD_AGENTS);
  get_url.searchParams.append('s', s);
  get_url.searchParams.append('ent', 'location');

  const { response: place } = await fetch(get_url.href)
  .then(data => data.json())
  .catch(err => console.log(err));

  if (!place) return null;
  else {
    // req.session.ctr = place.SOV_A3;
    return place.SOV_A3;
  }
}

exports.getLocationFromReq = function (req) {
  const referer = req.headers.referrer || req.headers.referer;
  const url = new URL(referer);
  const { pathname } = url;
  const ctr = pathname.split('/').filter(d => d?.length > 0)[0]
  return ctr;
}

exports.detectLocation = async function (req,res) {
  const { ctr } = req.session || {};
  const { p } = req.body || {};
  
  if (ctr) res.status(200).json({ ctr });
  else {
    const ctr = await getLocation(req,p);
    if (ctr) res.status(200).json({ ctr });
    else return res.status(400).json({ ctr });
  }
}