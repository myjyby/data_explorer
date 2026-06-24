const sql = require('mssql');
const { getLocation, getLocationFromReq } = require('./helpers.js');

exports.news = async function (req,res) {
  const { p } = req.query || {};
  const ctr = getLocationFromReq(req);
  if (!p?.length) return res.redirect('/');
  else {
    /*
    First, reframe the prompt around risk.
    */
    const get_reframe_url = new URL('reframe', process.env.CRD_AGENTS);
    get_reframe_url.searchParams.append('s', p);

    const { response: reframed } = await fetch(get_reframe_url.href)
    .then(data => data.json())
    .catch(err => console.log(err));

    const system_prompt = `
      Today's date is ${new Date().toLocaleDateString()}.
      You are an AI assistant that responds to a USER PROMPT,
      trying to unpack systemic risks along political, economic,
      social, environmental, and security dimensions related to the USER PROMPT.

      The user is located in ${ctr}. You must respond in a 
      contextually aware and appropriate manner. However, you 
      do not translate your response. You use the language of 
      the USER PROMPT for your response.

      You have several AI agents and workers working for you to retrieve 
      relevant and up-to-date information from search enginge queries 
      using engines like Google Search.

      These SEARCH RESULTS are passed to you as a list of strings.

      Use this information to rank political risks, 
      economic risks, social risks, environmental risks, and security risks
      related to the USER PROMPT.

      You must use the SEARCH RESULTS as context to produce 
      a high quality response to the USER PROMPT. 
      Your response must be intelligible and useful to a human reader.
      Please be formal in your response, not conversational.
    `;

    const get_url = new URL('search', process.env.DEEP_SEARCH);
    get_url.searchParams.append('s', reframed);
    get_url.searchParams.append('system_prompt', system_prompt);
    get_url.searchParams.append('source_category', 'news');
    get_url.searchParams.append('n_queries', 5);
    get_url.searchParams.append('recommendations', false);

    const news = await fetch(get_url.href)
    .then(data => data.json())
    .catch(err => console.log(err));

    return res.json({ news, search_limit: process.env.DEFAULT_SEMANTIC_SEARCH_LIMIT });
  }
}

exports.interpret = async function (req,res) {
  const { p, context } = req.query || {};
  if (!p?.length) return res.redirect('/');
  else {
    const get_url = new URL('interpret', process.env.CRD_AGENTS);
    get_url.searchParams.append('s', p);

    const interpreted = await fetch(get_url.href)
    .then(data => data.json())
    .catch(err => console.log(err));

    return res.status(200).json({ interpreted, search_limit: process.env.DEFAULT_SEMANTIC_SEARCH_LIMIT });
  }
}

exports.datasets = async function (req,res) {
  const ctr = getLocationFromReq(req);

  let { s, must_filters, must_not_filters, limit, offset } = req.query || {};
  if (!ctr) {
    /*
    Try to detect location once again.
    TO DO: There is a problem here as "s" is the string generated for the category. Not the initial prompt.
    */
    const ctr = await getLocation(req,s);
    if (!ctr) return res.status(400).json({})
  }

  if (!s?.length) return res.json({})
  else {
    if (!limit) limit = process.env.DEFAULT_SEMANTIC_SEARCH_LIMIT;
    /*
    Check that the filters are properly formatted.
    */
    if (!must_filters) must_filters = [];
    else if (typeof must_filters === 'string') must_filters = JSON.parse(must_filters);
    if (!Array.isArray(must_filters)) must_filters = [must_filters];

    if (!must_not_filters) must_not_filters = [];
    else if (typeof must_not_filters === 'string') must_not_filters = JSON.parse(must_not_filters);
    if (!Array.isArray(must_not_filters)) must_not_filters = [must_not_filters];
    /*
    Check if the must_filters contain a location [key, value] pair.
    */
    if (ctr) {
      if (!(must_filters.some(d => d.key === 'countries[]' && d.values.includes(ctr)))) {
        must_filters.push({
          key: 'countries[]',
          values: [ctr],
          matchType: 'any',
        });
      }
    }

    const get_url = new URL('search', process.env.SEMANTIC_SEARCH);
    const datasets = await fetch(get_url.href, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        s,
        must_filters,
        must_not_filters,
        limit,
        offset
      })
    }).then(data => data.json())
    .catch(err => console.log(err));

    return res.status(200).json(datasets);
  }
}

exports.DWHdata = async function (req,res) {
  const { id, fact_table, source_id, evt_id } = req.query || {};
  const { DWH } = req.app.locals || {};
  const ctr = getLocationFromReq(req);

  if (DWH) {
    if (fact_table === 'series' && id) {
      const request = new sql.Request(DWH);
      const { recordset } = await request
      .input('id', sql.Int, +id)
      .query(`
        SELECT 
          s.DimDataSet_Key AS id,
          s.Value AS value,
          c.Country_ISO AS iso3,
          c.Country_Name AS country_name,
          c.Country_Region AS UNDP_region,
          c.Country_UNSubRegion AS UN_Subregion,
          t.Date AS date
        FROM Reporting.Series s
        INNER JOIN Reporting.DimCountry c
          ON s.CountryFK = c.Country_Key
        INNER JOIN Reporting.DimTime t
          ON s.DateFK = t.Date_Key
        WHERE s.DimDataSet_Key = @id;
      `);
      res.status(200).json({ data: recordset, ctr });
    } else if (fact_tabe === 'events' && source_id && evt_id) {
      console.log('got an event')
    } else res.status(400).json({ data: [], ctr });
  } else {
    res.status(400).json({ data: [], ctr });
  }
}