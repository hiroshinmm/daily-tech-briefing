const http = require('http');
const https = require('https');

const feeds = {
  "SRD / XR": [
    "https://www.roadtovr.com/feed/",
    "https://uploadvr.com/feed/",
    "https://www.moguravr.com/feed/",
    "https://news.google.com/rss/search?q=XR+when:7d&hl=ja&gl=JP&ceid=JP:ja",
    "https://news.google.com/rss/search?q=%22Spatial+Reality+Display%22+when:7d&hl=en-US&gl=US&ceid=US:en"
  ],
  "Gaming Monitor": [
    "https://tftcentral.co.uk/feed",
    "https://blurbusters.com/feed/",
    "https://www.pcgamer.com/rss/",
    "https://www.4gamer.net/rss/index.xml",
    "https://pc.watch.impress.co.jp/data/rss/1.0/pcw/feed.rdf"
  ],
  "Production Monitor": [
    "https://www.newsshooter.com/feed/",
    "https://www.cined.com/feed/",
    "https://www.pronews.jp/feed",
    "https://www.provideocoalition.com/feed/",
    "https://www.redsharknews.com/rss.xml"
  ],
  "Camera Control": [
    "https://www.sonyalpharumors.com/feed/",
    "https://petapixel.com/feed/",
    "https://www.dpreview.com/feeds/news.xml",
    "https://dc.watch.impress.co.jp/data/rss/1.0/dcw/feed.rdf",
    "https://capa.getnavi.jp/feed/"
  ],
  "Projector": [
    "https://www.projectorcentral.com/rss.xml",
    "https://av.watch.impress.co.jp/data/rss/1.0/avw/feed.rdf",
    "https://www.audioholics.com/feed",
    "https://www.phileweb.com/rss2.0.xml",
    "https://hometheaterreview.com/feed/"
  ],
  "LED Wall Display": [
    "https://www.ravepubs.com/feed/",
    "https://www.digitalsignagetoday.com/rss/",
    "https://www.commercialintegrator.com/feed/",
    "https://www.ledinside.com/rss.xml",
    "https://news.google.com/rss/search?q=%22LED+Wall%22+display+when:7d&hl=en-US&gl=US&ceid=US:en"
  ],
  "SONY": [
    "https://www.sony.com/en/SonyInfo/News/Press/rss.xml",
    "https://www.sony.com/ja/SonyInfo/News/Press/rss.xml",
    "https://news.google.com/rss/search?q=Sony+when:7d&hl=en-US&gl=US&ceid=US:en",
    "https://news.google.com/rss/search?q=%E3%82%BD%E3%83%8B%E3%83%BC+when:7d&hl=ja&gl=JP&ceid=JP:ja",
    "https://news.google.com/rss/search?q=ソニー+ディスプレイ+when:7d&hl=ja&gl=JP&ceid=JP:ja"
  ],
  "TCL": [
    "https://news.google.com/rss/search?q=TCL+display+when:7d&hl=en-US&gl=US&ceid=US:en",
    "https://news.google.com/rss/search?q=TCL+monitor+when:7d&hl=en-US&gl=US&ceid=US:en",
    "https://news.google.com/rss/search?q=TCL+%E3%83%86%E3%83%AC%E3%83%93+when:7d&hl=ja&gl=JP&ceid=JP:ja",
    "https://news.google.com/rss/search?q=TCL+MiniLED+when:7d&hl=en-US&gl=US&ceid=US:en",
    "https://news.google.com/rss/search?q=CSOT+display+when:7d&hl=en-US&gl=US&ceid=US:en"
  ]
};

async function checkUrl(urlStr) {
  return new Promise((resolve) => {
    const parsed = new URL(urlStr);
    const client = parsed.protocol === 'https:' ? https : http;
    const req = client.get(urlStr, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } }, (res) => {
      // Follow redirects
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
        resolve(checkUrl(new URL(res.headers.location, urlStr).toString()));
        return;
      }
      resolve(res.statusCode);
    }).on('error', (err) => {
      resolve('ERROR ' + err.message);
    });
    req.setTimeout(5000, () => {
      req.destroy();
      resolve('TIMEOUT');
    });
  });
}

async function main() {
  for (const [category, urls] of Object.entries(feeds)) {
    console.log(`\n--- ${category} ---`);
    for (const url of urls) {
      const status = await checkUrl(url);
      console.log(`[${status}] ${url}`);
    }
  }
}

main();
