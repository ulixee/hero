module.exports = {
  titleTemplate: 'SecretAgent - The Web Browser Built for Scraping',
  siteUrl: 'https://secretagent.dev',
  pathPrefix: '/',
  outputDir: '../build-dist/website',
  templates: {},
  chainWebpack: config => {
    const svgRule = config.module.rule('svg');
    svgRule.uses.clear();
    svgRule.use('vue-svg-loader').loader('vue-svg-loader');
  },
  plugins: [
    {
      use: 'gridsome-plugin-pug',
      options: {
        pug: {
          /* Options for `pug-plain-loader` */
        },
        pugLoader: {
          /* Options for `pug-loader` */
        },
      },
    },
    {
      use: 'gridsome-plugin-typescript',
    },
    {
      use: '@gridsome/vue-remark',
      options: {
        baseDir: './docs',
        pathPrefix: '/docs',
        typeName: 'Docs',
        template: './src/templates/DocsPage.vue',
        plugins: ['@gridsome/remark-prismjs'],
        remark: {
          autolinkHeadings: {
            content: {
              type: 'text',
              value: '#',
            },
          },
        },
      },
    },
    {
      use: '@gridsome/vue-remark',
      options: {
        baseDir: './awaited-dom',
        pathPrefix: '/docs/awaited-dom',
        typeName: 'AwaitedDom',
        template: './src/templates/AwaitedDomDocsPage.vue',
        plugins: ['@gridsome/remark-prismjs'],
        remark: {
          autolinkHeadings: {
            content: {
              type: 'text',
              value: '#',
            },
          },
        },
      },
    },
    {
      use: '@gridsome/vue-remark',
      options: {
        baseDir: './blog',
        pathPrefix: '/blog',
        typeName: 'Post',
        template: './src/templates/BlogPost.vue',
        plugins: ['@gridsome/remark-prismjs'],
        remark: {
          autolinkHeadings: {
            content: {
              type: 'text',
              value: '#',
            },
          },
        },
      },
    },
    {
      use: '@microflash/gridsome-plugin-feed',
      options: {
        contentTypes: ['Post'],
        feedOptions: {
          title: 'SecretAgent Blog',
          description: 'A blog about scraping, features and experiences developing SecretAgent',
        },
        rss: {
          enabled: true,
          output: '/feed.xml',
        },
        atom: {
          enabled: true,
          output: '/feed.atom',
        },
        json: {
          enabled: true,
          output: '/feed.json',
        },
      },
    },
  ],
};
