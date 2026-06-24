import { d3, load } from '../helpers/index.mjs';

export const main = function (data,kwargs) {
  const { prompt: search, response } = data;
  const { parent } = kwargs || {};
  if (!parent) parent = d3.select('main');

  /*
  Remove placeholders
  */
  // parent.selectAll('section.risk-type.placeholder').remove();

  const types = parent.addElems('section', 'risk-type', response)
    .classed('placeholder', false);
  types.addElems('h2')
    .classed('placeholder', false)
  .addElems('a')
    .attr('href', '')
    .html(d => `${d.type} risks`);
  const risk = types.addElems('div', 'risk', d => d.risks)
    .classed('placeholder', false);
  risk.addElems('h3').html(d => d.label)
    .classed('placeholder', false);
  risk.addElems('p').html(d => d.description)
    .classed('placeholder', false);

  const datasets = risk.addElems('div', 'datasets');
  // datasets.addElems('g')

  datasets.addElems('div', 'scroll-x');
  
  datasets.addElems('div', 'loader-container')
  .addElems('div', 'loader');
  datasets.addElems('div', 'load-more')
  .addElems('div', 'arrow right');

  return datasets;
}