import kebabCase from 'lodash.kebabcase';

const links = require('../../docs/links.yaml');

export default function generateLinks() {
  links.forEach((group: any) => {
    group.link = `/docs/${kebabCase(group.title)}`;
    group.items = group.items.map((item: any) => {
      if (item.items) {
        item.link = `${group.link}/${kebabCase(item.title)}`;
        item.items = item.items.map((itm: any) => {
          if (typeof itm === 'string') {
            return {
              title: itm,
              link: `${item.link}/${kebabCase(itm)}`,
            };
          }
          return itm;
        });
      } else if (typeof item === 'string') {
        return {
          title: item,
          link: `${group.link}/${kebabCase(item)}`,
        };
      }
      return item;
    });
  });
  return links;
}
