import { caching } from './index.mjs';

export const news = function (p) {
  if (!p) throw('You must pass a prompt to retrieve information from the news.');

  const news_params = new URLSearchParams();
  news_params.append('p', p);

  const news_request = `/news?${news_params.toString()}`;
  return caching.data(news_request);
}

export const risk_sections = function (p, kwargs) {
  if (!p) throw('You must pass a prompt to retrieve risk sections.');

  const risk_params = new URLSearchParams();
  risk_params.append('p', p);
  for (let k in kwargs) {
    risk_params.append(k, kwargs[k]);
  }

  const risks_request = `/interpret?${risk_params.toString()}`;
  return caching.data(risks_request);
}

export const datasets = function (s,kwargs) {
  const { must_filters, must_not_filters, limit, offset } = kwargs || {};
  
  if (!s) throw('You must pass a search query to retrieve datasets.');

  const datasets_params = new URLSearchParams();
  datasets_params.append('s', s);
  if (must_filters) datasets_params.append('must_filters', JSON.stringify(must_filters)) ;
  if (must_not_filters) datasets_params.append('must_not_filters', JSON.stringify(must_not_filters)) ;
  if (limit) datasets_params.append('limit', limit);
  if (offset) datasets_params.append('offset', offset);

  const datasets_request = `/datasets?${datasets_params.toString()}`;
  return caching.data(datasets_request);
}

export const data = async function (id, kwargs) {
  if (!id) throw('You must pass an id to retrieve a dataset.');

  const data_params = new URLSearchParams();
  data_params.append('id', id);
  for (let k of Object.keys(kwargs)) {
    data_params.append(k, kwargs[k]);
  }
  
  const data_request = `/DWHdata?${data_params.toString()}`;
  return caching.data(data_request);
}