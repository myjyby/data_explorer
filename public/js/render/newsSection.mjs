import { d3, load } from '../helpers/index.mjs';
import { marked } from "https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js";

export const main = function (data,kwargs) {
  const { prompt: search, response } = data;
  const { parent } = kwargs || {};
  if (!parent) parent = d3.select('main');

  /*
  Remove placeholders
  */
  console.log(response.split(/\n/g))
  const section = parent.addElems('section', 'news', [response])
    .classed('placeholder', false);
  section.addElems('p', null, d => d.split(/\n/g)).html(d => marked.parse(d))
    .classed('placeholder', false);
  section.addElems('small').html('This snippet was generated using Gemma3 and search results from SearXng.')
}