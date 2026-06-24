import { d3 } from '../helpers/index.mjs';

export const dimensions = function (parentNode) {
  const {
    clientWidth: cw,
    clientHeight: ch,
    offsetWidth: ow,
    offsetHeight: oh,
  } = d3.select(parentNode).node() || document.body;
  const width = cw ?? ow;
  // const height = ch ?? oh;
  const height = width * .5;
  return { width, height };
}

export const main = function (parentNode,kwargs) {
  let { scale } = kwargs || {};
  if (scale === undefined) scale = true;
  const { width, height } = dimensions(parentNode);

  const container = d3.select(parentNode || 'body');
  const svg = container.addElem('svg')
    .attr('x', 0)
    .attr('y', 0)
    .attr('viewBox', scale ? `0 0 ${width} ${height}` : null)
    .attr('preserveAspectRatio', scale ? 'xMidYMid meet' : null);

  return { width, height, svg };
}