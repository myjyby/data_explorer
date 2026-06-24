const { getLocation } = require('./helpers.js');

exports.home = function (req,res) {
  // let { ctr } = req.session || {};
  const { ctr } = req.params || {};
  res.status(200).render('home', { ctr })
}
exports.explore = async function (req,res) {
  let { ctr } = req.params || {};
  const { p } = req.query || {};
  const referer = req.headers.referrer || req.headers.referer;
  const { origin } = new URL(referer);

  if (!p?.length) return res.redirect('/');
  if (!ctr) {
    ctr = await getLocation(req, p);
    const redirect = new URL(`${ctr}/explore`, origin);
    redirect.searchParams.append('p', p);
    return res.redirect(redirect.href);
  }

  return res.status(200).render('explore', { ctr, prompt: p, type: 'explore' });
}
exports.exploreRisk = async function (req,res) {
  let { ctr, risk, category } = req.params || {};
  const { p, s } = req.query || {};
  const referer = req.headers.referrer || req.headers.referer;
  const { origin } = new URL(referer);

  if (!p?.length || !s?.length) return res.redirect('/');
  if (!ctr) {
    ctr = await getLocation(req, p);
    const redirect = new URL(`${ctr}/explore/${risk}${category ? `/${category}` : ''}`, origin);
    redirect.searchParams.append('p', p);
    redirect.searchParams.append('s', s);
    return res.redirect(redirect.href);
  }

  return res.render('exploreRisk', { ctr, prompt: p, type: 'explore' });
}
exports.search = async function (req,res) {
  let { ctr } = req.params || {};
  let { s, must_filters, must_not_filters, limit, offset } = req.query || {};
  
  if (!s?.length) return res.redirect('/');
  if (!ctr) {
    ctr = await getLocation(req, s);
    const redirect = new URL(`${ctr}/search`, origin);
    redirect.searchParams.append('s', s);
    return res.redirect(redirect.href);
  }

  return res.status(200).render('search', { ctr, query: s,  type: 'search' });
}
exports.notfound = function (req,res) {
  res.send('no page here')
}