const { DWH, DB } = require('./db/index.js');
const express = require('express');
const path = require('path');
// const jwt = require('jsonwebtoken');
const bodyparser = require('body-parser');
const fs = require('fs');
const session = require('express-session');
const PgSession = require('connect-pg-simple')(session);

// const multer = require('multer');
// const upload = multer({ dest: './tmp' });
// const helmet = require('helmet');
// const { xss } = require('express-xss-sanitizer');
const cookieParser = require('cookie-parser');

const app = express();
app.disable('x-powered-by');

// app.use((req, res, next) => {
//   res.locals.nonce = lodashNonce();
//   next();
// });

// app.use(
//   helmet({
//     contentSecurityPolicy: {
//       directives: {
//         'img-src': csp_links,
//         'script-src': csp_links.concat([
//           (req, res) => `'nonce-${res.locals.nonce}'`,
//           'sha256-NNiElek2Ktxo4OLn2zGTHHeUR6b91/P618EXWJXzl3s=',
//           'strict-dynamic',
//           'https://gc.zgo.at',
//         ]),
//         'script-src-attr': [
//           "'self'",
//           '*.sdg-innovation-commons.org',
//           'sdg-innovation-commons.org',
//         ],
//         'style-src': csp_links,
//         'connect-src': csp_links.concat([
//           'https://sdg-innovation-commons.goatcounter.com/count',
//         ]),
//         'frame-src': [
//           "'self'",
//           '*.sdg-innovation-commons.org',
//           'sdg-innovation-commons.org',
//           'https://www.youtube.com/',
//           'https://youtube.com/',
//           'https://web.microsoftstream.com',
//         ],
//         'form-action': [
//           "'self'",
//           '*.sdg-innovation-commons.org',
//           'sdg-innovation-commons.org',
//         ],
//       },
//     },
//     referrerPolicy: {
//       policy: ['strict-origin-when-cross-origin', 'same-origin'],
//     },
//     xPoweredBy: false,
//     strictTransportSecurity: {
//       maxAge: 123456,
//     },
//     // defaultProps: {
//     //   encodeSpecialCharacters: false,
//     // },
//   }),
// );

// app.use(function (req, res, next) {
//   res.setHeader('Access-Control-Allow-Origin', 'same-origin');
//   next();
// });

app.set('view engine', 'ejs');
app.set('trust proxy', true); // trust leftmost proxy
app.use(express.static(path.join(__dirname, './public')));
// app.use('/scripts', express.static(path.join(__dirname, './node_modules')));
// app.use('/config', express.static(path.join(__dirname, './config')));
app.use(bodyparser.json({ limit: '50mb' }));
app.use(bodyparser.urlencoded({ limit: '50mb', extended: true }));

// const options = {
//   allowedKeys: ['referer'],
//   allowedAttributes: {
//     referer: ['&'],
//   },
// };
// app.use(xss(options));

const cookie = {
  domain: undefined, //process.env.NODE_ENV === 'production' ? app_base_host : undefined,
  httpOnly: true, // THIS IS ACTUALLY DEFAULT
  secure: process.env.NODE_ENV === 'production',
  maxAge: 1 * 1000 * 60 * 60 * 24 * 1, // DEFAULT TO 1 DAY. UPDATE TO 1 YEAR FOR TRUSTED DEVICES
  sameSite: 'lax',
};

const sessionMiddleware = session({
  name: 'CRD-session',
  // secret: 'acclabspadspass',
  secret: process.env.SESSION_PASS,
  store: new PgSession({ pgPromise: DB }),
  resave: false,
  saveUninitialized: false,
  cookie,
});

app.use(sessionMiddleware);
app.use(cookieParser(process.env.SESSION_PASS));

const routes = require('./routes/');

app.get('/', routes.render.home);
app.get('/:ctr/home', routes.render.home);

// app.route('/getCTRfocus')
//   .get(routes.getCTRfocus);

app.route('{/:ctr}/explore')
  .get(routes.render.explore);

app.route('{/:ctr}/explore/:risk/{:category}')
  .get(routes.render.exploreRisk);

app.route('{/:ctr}/search/')
  .get(routes.render.search);

app.route('/news')
  .get(routes.data.news);

app.route('/interpret')
  .get(routes.data.interpret);

app.route('/datasets')
  .get(routes.data.datasets);

app.route('/DWHdata')
  .get(routes.data.DWHdata);

app.get('/{*splat}', routes.render.notfound);

/*
Connect to the DWH
and run the server
*/
DWH.connect().then(function(pool) {
  app.locals.DWH = pool;
  app.locals.data = {};
  app.listen(process.env.PORT || 2000, async (_) => {
    console.log(`the app is running on port ${process.env.PORT || 2000}`);
  });
}).catch(function(err) {
  console.error('Error creating connection pool', err);
});