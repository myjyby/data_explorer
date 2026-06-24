import { d3 } from '../helpers/index.mjs';
import * as render from './index.mjs';

export const main = function (parent,data,kwargs) {
  const { offset } = kwargs || {};
  const cards = parent.addElems('div', `card-set offset-${offset}`, [data])
  .addElems('div', 'grid')
  .addElems('div', 'card', d => d);
  cards.addElems('div', 'risk-level');
  cards.addElems('h4')
    .html(d => {
      if (d.indicator) return `<span>Dataset:</span> ${d.indicator}`;
      else return null;
    });

  cards.addElems('div', 'loader-container')
    .addElems('div', 'loader');
  cards.each(function (d) {
    render.visualizations.linechart(d, { parent: this, ...kwargs });
  });
  cards.addElems('p')
    .html(d => {
      if (d.description) return `<span>Description:</span> ${d.description}`;
      else return null;;
    });

  const metadata = cards.addElems('div', 'metadata');
  metadata.addElems('small', 'attribution')
    .html(d => `<u>Source:</u> <a href="${d.source_url}" target="_blank">${d.source_attribution}</a>`);
  metadata.addElems('small', 'frequency')
    .html(d => `<u>Update frequency:</u> ${d.update_frequency}`);

  // update_frequency,
  // source_url, 
  // source_attribution,
  // source_license

  /*
  const footer = cards.addElems('footer');
  const score = footer.addElems('div', 'scoring-container')
  .each(function () {
    const sel = d3.select(this);
    render.widgets.scoring(new Array(5).fill(0).map((d,i) => i + 1), { parent: sel });
  });
  */

  return cards;
}