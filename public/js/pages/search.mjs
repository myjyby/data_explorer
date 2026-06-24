import { d3, caching, load } from '../helpers/index.mjs';
import * as render from '../render/index.mjs';

async function onLoad () {
  /*
  Get the country information
  */
  // const location = new URL(window.location);
  // const ctr = location.pathname.split('/').filter(d => d?.length)[0];
  // if (ctr.length !== 3) ctr = undefined;
  const main = d3.select('main');
  const prompt = d3.select('input[name="p"]').node().value;
  /*
  Get the latest news related to the search.
  */
  // const { news } = await load.news(prompt);
  // render.newsSection(news, { parent: main });
  
  /*
  Get the risk section information
  */
  // const { interpreted: risks, search_limit: limit } = await load.risk_sections(prompt);//, { context: news.response });
  // const sections = render.riskSections(risks, { parent: main });

  const sections = main.selectAll("section.indicators");
  /*
  Get the most relevant datasets for each section
  */
  const charts = [...sections.nodes()]
  let loaded_ids = [];

  for (const c of charts) {
    const sel = d3.select(c);
    const { label, description } = sel.datum() || {};

    /*
    Get the datasets
    */
    const search = prompt;//`${label}. ${description}`;
    const { 
      response: DWH_datasets, 
      must_filters, 
      must_not_filters,
      limit: retrieved_limit, 
      offset 
    } = await load.datasets(search, { limit: 15, must_not_filters: [{ key: 'id', values: loaded_ids, matchType: 'id' }] });
    /*
    Add the loaded ids to the filter to avoid duplicate indicators.
    */
    loaded_ids = [...loaded_ids, ...DWH_datasets.map(d => d.id)];
    /*
    Note: theoretically, limit and retrieved_limit should be the same.
    However, we use retrieved_limit below to offset any scrolling in the semantic search 
    as it is what is returned by the previous search.
    */
    /*
    Render the dataset cards
    */
    sel.select('div.loader-container').remove();
    const cards = render.datasetCard(sel.select('.scroll-x'), DWH_datasets, { offset });
    /*
    Note: offset is passed in the kwargs above to set a class name for the dataset cards container.
    This way, as more sets are dynamically loaded, the containers do not conflict.
    */
    /*
    Enable the user to load more datasets
    */
    sel.select('div.load-more')
    .datum({
      offset: retrieved_limit,
    }).on('click', async function (evt,d) {
      /*
      Scroll the qdrant vector db for more datasets.
      */
      const all_ids = d3.selectAll('.card').data().map(c => c.id);
      let { 
        response: more_DWH_datasets, 
        limit: newly_retrieved_limit, 
        offset: newly_retrieved_offset 
      } = await load.datasets(search, { 
        must_filters, 
        must_not_filters: [{ key: 'id', values: all_ids, matchType: 'id' }], 
        limit, 
        offset: d.offset 
      });
      
      const cards = render.datasetCard(sel.select('.scroll-x'), more_DWH_datasets, { offset: d.offset });
      /*
      Scroll the new set of datasets into view.
      */
      sel.select(`.card-set.offset-${d.offset}`).node()
        .scrollIntoView({ behavior: 'smooth', block: 'center' })
      /*
      Update the stored offset for any future scroling in the vector db.
      */
      d.offset = newly_retrieved_offset + newly_retrieved_limit;
    })
  }
}


if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", function () {
    onLoad();
  });
} else {
  (async () => {
    await onLoad();
  })();
}