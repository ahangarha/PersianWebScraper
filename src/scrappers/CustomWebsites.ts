import { clsScrapper } from "../modules/clsScrapper";
import { enuDomains, enuMajorCategory, enuMinorCategory, IntfMappedCategory, IntfPageContent } from "../modules/interfaces";
import { HTMLElement, parse } from "node-html-parser"
import { IntfRequestParams } from "../modules/request";
//import { normalizeText } from "../modules/common";

export class divar extends clsScrapper {
  constructor() {
    super(enuDomains.divar, "divar.ir", {
      basePath: "/s/iran",
      selectors: {
        article: "article .kt-row",
        title: ".kt-page-title__title",
        subtitle: ".kt-page-title__subtitle",
        datetime: {
          acceptNoDate: true
        },
        content: {
          main: "p.kt-description-row__text, .kt-col-5 section:nth-child(1) .post-page__section--padded, img.kt-image-block__image",
        },
        category: {
          selector: (_, fullHtml: HTMLElement) => fullHtml.querySelectorAll("ol.kt-breadcrumbs li a")
        },
        tags: "nav .kt-wrapper-row a button"
      }
    })
  }
}
export class extern extends clsScrapper {
  constructor() {
    super(enuDomains.extern, "extern.ir", {
      selectors: {
        article: "body.single",
        title: "h1",
        datetime: {
          conatiner: (_, fullHtml: HTMLElement) => fullHtml.querySelector("time"),
          splitter: (el: HTMLElement) => el.getAttribute("datetime")?.substring(0, 10) || "NO_DATE"
        },
        content: {
          main: ".paper__content, figure.paper__thumbnail",
          ignoreNodeClasses: ["toc"]
        },
        category: {
          selector: "nav.rank-math-breadcrumb p a"
        },
        tags: "a[rel='tag']",
        comments: {
          container: (_, fullHtml: HTMLElement) => fullHtml.querySelectorAll("ol.comments__list li article"),
          author: ".comment__author .fn",
          datetime: "time",
          text: ".comment__content"
        }
      },
    })
  }

  mapCategoryImpl(cat: string | undefined, first: string, second: string): IntfMappedCategory {
    const mappedCat: IntfMappedCategory = { major: enuMajorCategory.Weblog, minor: enuMinorCategory.Medical }
    if (!cat) return mappedCat
    void cat, first, second

    if (second.startsWith("سلامتی")) return { ...mappedCat, minor: enuMinorCategory.Health }
    if (second.startsWith("اخبار")) return { major: enuMajorCategory.News, minor: enuMinorCategory.Health }
    if (second.startsWith("سؤالات")) return { ...mappedCat, subminor: enuMinorCategory.FAQ }
    if (second.startsWith("کتاب‌ها")) return { ...mappedCat, subminor: enuMinorCategory.Education }
    if (second.startsWith("آموزش")) return { ...mappedCat, subminor: enuMinorCategory.Education }
    return mappedCat
  }
}

export class rastineh extends clsScrapper {
  constructor() {
    super(enuDomains.rastineh, "rastineh.com", {
      selectors: {
        article: ".single_page article",
        title: "h1",
        datetime: {
          conatiner: (_, fullHtml: HTMLElement) => fullHtml.querySelector("meta[property='article:published_time'], time"),
          splitter: (el: HTMLElement) => el.getAttribute("content") || el.getAttribute("datetime")?.split("T").at(0) || "NO_DATE"
        },
        content: {
          main: ".single_content",
          ignoreNodeClasses: ["su-spoiler"]
        },
        category: {
          selector: "#crumbs a",
          startIndex: 1
        },
        tags: "a[rel='tag']",
        comments: {
          container: (_, fullHtml: HTMLElement) => fullHtml.querySelectorAll("ol.comment-list li .comment-body"),
          author: ".comment-author cite",
          text: "p"
        }
      },
    })
  }
}

export class rasekhoon extends clsScrapper {
  constructor() {
    super(enuDomains.rasekhoon, "rasekhoon.net", {
      selectors: {
        article: ".js_ConID .MainIntra",
        title: "h1",
        subtitle: ".Sootitr",
        datetime: {
          conatiner: ".Date"
        },
        content: {
          main: "article, img.ira",
        },
        category: {
          selector: (_, fullHtml: HTMLElement) => fullHtml.querySelectorAll("nav.SubNav div a")
        },
      },
      url: {
        removeWWW: true
      }
    })
  }
}

export class eporsesh extends clsScrapper {
  constructor() {
    super(enuDomains.eporsesh, "eporsesh.com", {
      selectors: {
        article: ".node-historyquestioncontent.view-mode-full, body.node-type-article, body.node-type-picnews, body.node-type-montakhabepayamaki",
        title: (_, fullHtml: HTMLElement) => fullHtml.querySelector("h1"),
        subtitle: ".Sootitr",
        datetime: {
          acceptNoDate: true
        },
        content: {
          main: ".group-header, .field-name-field-image div div, .field-type-text-with-summary div div, .flexslider ul li," +
            ".field-name-field-picnews-headpic div div, .field-name-field-montakhabepayamaki-questio div div",
          ignoreTexts: [/.*eitaa.*/]
        },
        category: {
          selector: "[property='rdfs:label skos:prefLabel']"
        },
      },
      url: {
        removeWWW: true
      }
    })
  }
  protected mapCategoryImpl(): IntfMappedCategory {
    return { major: enuMajorCategory.Weblog, minor: enuMinorCategory.Religious }
  }

}

export class nazaratshora extends clsScrapper {
  constructor() {
    super(enuDomains.nazaratshora, "nazarat.shora-rc.ir", {
      selectors: {
        article: "#panel_SiteMaster pre",
        acceptNoTitle: true,
        datetime: {
          acceptNoDate: true
        },
        content: {
          main: (_, fullHtml: HTMLElement) => {
            const content = fullHtml.querySelectorAll("#panel_SiteMaster")[0]?.childNodes[1].childNodes[3].childNodes[1].rawText
            return [parse(content)]
          },
        },
      },
      url: {
        removeWWW: true,
        forceHTTP: true
      }
    })
  }
}

export class sariasan extends clsScrapper {
  constructor() {
    super(enuDomains.sariasan, "sariasan.com", {
      selectors: {
        article: "body.single-post",
        title: "h1",
        datetime: {
          conatiner: (_, fullHtml: HTMLElement) => fullHtml.querySelector("time"),
          splitter: (el: HTMLElement) => el.getAttribute("datetime") || "NO_DATE"
        },
        content: {
          main: ".post_content .wprt-container",
          ignoreNodeClasses: ["saria-content_1"],
          ignoreTexts: [/.*دانلود کنید:.*/, /.*اینجا کلیک کنید.*/, /.*حتما بخوانید:.*/, /.*همه زبان های برنامه نویسی.*/, /.*<img.*/]
        },
        comments: {
          container: "ul.w-comments-list li",
          author: ".w-comments-item-author",
          text: ".w-comments-item-text"
        },
        category: {
          selector: ".rank-math-breadcrumb p a"
        },
        tags: "[rel='tag']"
      },
    })
  }
}

export class mihandownload extends clsScrapper {
  constructor() {
    super(enuDomains.mihandownload, "mihandownload.com", {
      selectors: {
        article: "#pri",
        title: ".title-post-main a",
        datetime: {
          conatiner: ".dates "
        },
        content: {
          main: ".content-post-main",
          ignoreNodeClasses: ["wp-block-buttons"],
        },
        comments: {
          container: (_, fullHtml: HTMLElement) => fullHtml.querySelectorAll("ol.commentlist li .comment-body"),
          author: ".comment-author cite.fn",
          text: "p"
        },
        category: {
          selector: ".category a"
        },
        tags: "[rel='tag']"
      },
      url: {
        removeWWW: true
      }
    })
  }
}

export class uptvs extends clsScrapper {
  constructor() {
    super(enuDomains.uptvs, "uptvs.com", {
      selectors: {
        article: "body.single-post",
        title: "h1",
        datetime: {
          conatiner: (_, fullHtml: HTMLElement) => fullHtml.querySelector("meta[property='article:published_time'], time"),
          splitter: (el: HTMLElement) => el.getAttribute("content") || el.getAttribute("datetime")?.split("T").at(0) || "NO_DATE"
        },
        content: {
          main: ".post-content .text-lg-right, img.top-single-img",
          //ignoreNodeClasses: ["wp-block-buttons"],
        },
        comments: {
          container: (_, fullHtml: HTMLElement) => fullHtml.querySelectorAll(".comment-body"),
          author: ".vcard .pr-half span:nth-child(1)",
          text: ".pr-lg-45 p"
        },
        category: {
          selector: (_, fullHtml: HTMLElement) => fullHtml.querySelectorAll("span.category_post a")
        },
      },
    })
  }
}

export class mihanwp extends clsScrapper {
  constructor() {
    super(enuDomains.mihanwp, "mihanwp.com", {
      selectors: {
        article: ".single-post",
        title: "h1",
        datetime: {
          conatiner: (_, fullHtml: HTMLElement) => fullHtml.querySelector("time"),
          splitter: (el: HTMLElement) => el.getAttribute("datetime") || "NO_DATE"
        },
        content: {
          main: "article",
          ignoreNodeClasses: ["clearfix", "rmp-widgets-container", "ez-toc-v2_0_61", "wp-block-heading"],
        },
        category: {
          selector: (_, fullHtml: HTMLElement) => fullHtml.querySelectorAll(".rank-math-breadcrumb p a"),
        },
        comments: {
          container: (_, fullHtml: HTMLElement) => fullHtml.querySelectorAll("ol.comment-list li"),
          author: ".comment-author-name",
          text: ".comment-block p"
        }
      },
    })
  }
}

export class noozdahkala extends clsScrapper {
  constructor() {
    super(enuDomains.noozdahkala, "19kala.com", {
      selectors: {
        article: ".product-page-content",
        title: "h1",
        datetime: {
          acceptNoDate: true
        },
        content: {
          main: ".tabs-content, #tab-specification",
        },
        comments: {
          container: (_, fullHtml: HTMLElement) => fullHtml.querySelectorAll("#review .table tbody"),
          text: "tr:nth-child(2) td .col-md-9"
        },
        category: {
          selector: (_, fullHtml: HTMLElement) => fullHtml.querySelectorAll("ul.breadcrumb li a")
        },
        tags: "[rel='tag']"
      },
    })
  }
}

export class digikaproducts extends clsScrapper {
  constructor() {
    super(enuDomains.digikaproducts, "digikala.com", {
      api: async (url: URL, reParams: IntfRequestParams, data?: any) => {
        const pageContent: IntfPageContent = { url: url.toString(), links: [] }
        reParams
        pageContent.links.push("https://api.digikala.com/v1/brands/");

        if (data.data && data.data.brands) {
          const brand_codes: string[] = [];
          Object.values(data.data.brands).forEach((brand: any) => {
            brand.forEach((code) => {
              brand_codes.push(code.url.uri.substring(7, code.url.uri.length - 1))
            });
          });
          await Promise.all(brand_codes.map(async (brand_code) => {
            let pageExists = true;
            let page = 1;
            while (pageExists) {
              const productsResponse = await fetch(`https://api.digikala.com/v1/brands/${brand_code}/?seo_url=&page=${page}`, { method: "GET" });
              pageContent.links.push(`https://api.digikala.com/v1/brands/${brand_code}/?seo_url=&page=${page}`)
              const brand = await productsResponse.json();
              if (page < brand.data.pager.total_pages) {
                page++;
              } else {
                pageExists = false;
              }
            }
          }))
        }
        return pageContent
      },
      url: { removeWWW: true }
    })
  }
}