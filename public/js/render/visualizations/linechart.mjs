import { d3, arrays, load } from '../../helpers/index.mjs';
import * as render from '../index.mjs';
// import { colors } from './settings.mjs';

const focus = 'region';
const regionType = 'UN_Subregion';

export const main = async function (dataset, kwargs) {
  const { fact_tabe: fact_table, id: dataset_id, source_id, evt_id } = dataset || {};
  let { width, height, svg, parent } = kwargs || {};
  if (!svg) {
    const canvas = render.canvas(parent);
    svg = canvas.svg;
    width = canvas.width;
    height = canvas.height;
  }
  const padding = .1;

  /*
  Fetch the data
  */
  let { data, ctr } = await load.data(dataset_id, { fact_table });
  /*
  Filter only the last 10 years of data
  Credit for the last 10 year filter:
    Source - https://stackoverflow.com/a/20257318
    Posted by Praveen, modified by community. See post 'Timeline' for change history
    Retrieved 2026-05-24, License - CC BY-SA 3.0
  */
  let today = new Date();
  today.setHours(0,0,0,0);
  const thisYear = new Date(today.getFullYear(), 0, 1);
  const tenYearsAgo = new Date(today.setFullYear(today.getFullYear() -10)).getTime();

  /*
  Remove the loader
  */ 
  d3.select(parent).select('.loader-container').remove();

  /*
  Parse out regional data
  */
  if (focus === 'region') {
    const focusRegion = data.find(d => d.iso3 === ctr)?.[regionType];
    data = data.filter(d => d[regionType] === focusRegion);
  }
  /*
  Only filter the last ten years if there is data.
  If not, then show the full time range.
  */
  if (data.filter(d => +new Date(d.date) >= tenYearsAgo && d.iso3 === ctr).length >= 2) {
    data = data.filter(d => {
      return +new Date(d.date) >= tenYearsAgo;
    });
  }
  data.sort((a, b) => +new Date(a.date) - +new Date(b.date));


  /*
  Dynamically set the yscale range.
  */
  const nestedDates = arrays.nest.call(data, { key: 'date', keep: 'date' });
  const mean = nestedDates.map(d => {
    const obj = {};
    obj.date = d.date;
    obj.value = d3.mean(d.values, c => c.value);
    return obj;
  });
  const quartiles = nestedDates.map(d => {
    const values = d.values.map(c => c.value);
    const obj = {};
    obj.date = d.date;
    obj.values = [d3.quantile(values, .25), d3.quantile(values, .75)];
    return obj;
  });

  /*
  Compute z-scores for country c compared to other countries at time t
  */
  const zScores = nestedDates.map(d => {
    const values = d.values.map(c => c.value);
    const mean = d3.mean(d.values, c => c.value);
    const std = d3.deviation(d.values, c => c.value);
    const x = d.values.find(c => c.iso3 === ctr)?.value;
    if (!x) return null;
    else {
      const z = (x - mean) / std;
      if (Math.abs(z) <= 1) return true;
      // if (x <= mean + std * 2 && x >= mean - std * 2) return true;
      else return false;
    }
  }).filter(d => d !== null);

  let riskLevel = 'transparent';
  if (zScores.filter(d => d === false).length >= zScores.length/ 2) {
    if (zScores[zScores.length - 1] === false) riskLevel = 'red';
    else riskLevel = 'orange';
  } else {
    if (zScores[zScores.length - 1] === false) riskLevel = 'orange'; 
  }
  const card = d3.select(parent);
  card.select('.risk-level')
  .style('background-color', riskLevel)

  let y_range = d3.extent(data.filter(d => d.iso3 === ctr), d => d.value);
  nestedDates.forEach(d => {
    const values = d.values.map((c) => c.value);
    y_range[0] = Math.min(y_range[0], Math.min(...mean.map(c => c.value)), d3.quantile(values, .1));
    y_range[1] = Math.max(y_range[1], Math.max(...mean.map(c => c.value)), d3.quantile(values, .9));
  });

  const x = d3.scaleTime([d3.min(data, d => new Date(d.date)), Math.max(d3.max(data, d => new Date(d.date)), thisYear)], [width * padding, width * (1 - padding)]);
  const y = d3.scaleLinear(y_range, [height * (1 - padding), height * padding]);
  
  /*
  Draw lines.
  */
  const line = d3.line()
    .curve(d3.curveMonotoneX)
    .x(d => x(new Date(d.date)))
    .y(d => y(d.value));

  const area = d3.area()
  .curve(d3.curveMonotoneX)
  .x(d => x(new Date(d.date)))
  .y0(d => y(d.values[0]))
  .y1(d => y(d.values[1]));

  let trial = 1

  svg.on('click', function () {
  }).on('dblclick', async function () {
    console.log(dataset_id, data)
    trial += 1;
    let { data: reloaded_data, ctr } = await load.data(dataset_id, { fact_table, trial });
    console.log(reloaded_data, ctr)
  })
    .addElems('path', 'quartiles-25-75', [quartiles])
    .style('fill', render.settings.colors['light-grey'])
    .style('fill-opacity', .5)
    .attr('d', area);

  svg.addElems('path', 'mean-line', [mean])
    .style('fill', 'none')
    .style('stroke', render.settings.colors['mid-grey'])
    .style('stroke-width', 2)
    .style('stroke-dasharray', '2,4')
    .attr('d', line);

  svg.addElems('g', 'lines', arrays.nest.call(data, { key: 'iso3', keep: 'country_name' }).filter(d => d.key === ctr))
    .style('fill', 'none')
    .style('stroke', d => {
      if (d.key.toLowerCase() === ctr.toLowerCase()) return render.settings.colors['UN blue'];
      else return render.settings.colors['light-grey'];
    }).style('stroke-width', 2)
  .addElems('path', 'line', d => [d.values])
    .attr('d', line);

  /*
  Explicitly show missing data.
  Credit for SVG stripes: https://svg-stripe-generator.web.app/
  */
  if (+thisYear > +d3.max(data, d => new Date(d.date))) {
    const defs = svg.addElems('defs')
    .addElems('pattern')
      .attr('id', 'stripes')
      .attr('patternUnits', 'userSpaceOnUse')
      .attr('width', 5)
      .attr('height', 5)
      .attr('patternTransform', 'rotate(45)');
    defs.addElems('line')
      .attr('x1', 0)
      .attr('y', 0)
      .attr('x2', 5)
      .style('stroke', render.settings.colors['light-grey'])
      .style('stroke-width', 2);
    svg.addElems('rect')
      .attr('x', x(d3.max(data, d => new Date(d.date))))
      .attr('width', x(thisYear) - x(d3.max(data, d => new Date(d.date))))
      .attr('height', height * (1 - padding))
      .attr('fill', `url(#stripes)`);
  }

  /*
  Add axes.
  */
  svg.addElems('g', 'axis-bottom')
    .attr('transform', `translate(${[0, height * (1 - padding)]})`)
  .call(d3.axisBottom(x));
  
  svg.addElems('g', 'axis-left')
    .attr('transform', `translate(${[width * padding, 0]})`)
  .call(d3.axisLeft(y))
    .selectAll('text')
    .attr('fill', 'rgba(30,30,50)')
    .attr('text-anchor', 'end')
    .text(d => d);
}