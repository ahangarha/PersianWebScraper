
import { clsScrapper } from "../modules/clsScrapper";
import { enuDomains, IntfComment } from "../modules/interfaces";
import { HTMLElement } from "node-html-parser"
import { dateOffsetToDate, getElementAtIndex, normalizeText } from "../modules/common";
import { axiosPost, IntfRequestParams } from "../modules/request";
import { log } from "../modules/logger";


export class virgool extends clsScrapper {
    constructor() {
        super(enuDomains.virgool, "virgool.io", {
            selectors: {
                article: (parsedHtml: HTMLElement) =>
                    parsedHtml.querySelector(".post-content") || (parsedHtml.querySelector('section.site-body') ? undefined : parsedHtml.querySelector("section>div>div>div")),
                title: "h1",
                content: {
                    main: (article: HTMLElement) => article.querySelectorAll(".post-body>*"),
                    alternative: (article: HTMLElement) => getElementAtIndex(article.childNodes, 2)?.querySelectorAll("*"),
                    ignoreNodeClasses: ["fw-900"]
                },
                tags: (article: HTMLElement) => article.querySelectorAll('a').filter(el => el.getAttribute("href")?.startsWith("/tag")),
                datetime: {
                    conatiner: (article: HTMLElement, fullHtml: HTMLElement) => {
                        const byClass = fullHtml.querySelector(".author.module .module-footer .data")
                        if (byClass)
                            return byClass
                        return getElementAtIndex(article.childNodes, 0)?.querySelector("div>div>div>span>div>span:last-child")
                    },
                    splitter: dateOffsetToDate,
                },
                comments: {
                    container: ".comments-section article",
                    author: "div>div>div:first-child>div>span>a",
                    text: "div>div:nth-child(2)"
                }
            },
            url: {
                removeWWW: true
            }
        })
    }
}

export class blogir extends clsScrapper {
    constructor() {
        super(enuDomains.blogir, "blog.ir", {
            selectors: {
                article: (page: HTMLElement) =>
                    (page.querySelectorAll("#block-post") ||
                        page.querySelectorAll(".post")
                    ).length > 1
                        ? page.querySelector("NOArticle")
                        : (page.querySelector("#block-post") || page.querySelector(".post")),
                title: ".title, .post-title",
                content: {
                    main: ".body .cnt>*, .post-full-content>*, .post-matn>*, .post-content",
                    ignoreNodeClasses: ["fw-900"]
                },
                tags: (article: HTMLElement) => article.querySelectorAll('a').filter(el => el.getAttribute("href")?.startsWith("/tag")),
                datetime: {
                    conatiner: ".post_date, .post-details-date, .date_title, .post-detail-right"
                },
                comments: {
                    container: (article: HTMLElement) => article.querySelectorAll(".cm-body, .cm-reply-main, .comment-reply"),
                    author: ".cm-name",
                    datetime: ".post-detail-top, .comment-date",
                    text: ".comment-matn, .comment-body, .comment-reply-body, .comment-reply"
                }
            },
        })
    }

    normalizePath(url: URL) {
        return url.toString()
    }
}

export class ninisite extends clsScrapper {
    constructor() {
        super(enuDomains.ninisite, "ninisite.com", {
            selectors: {
                article: "article, .col-xl-9",
                title: "h1",
                content: {
                    main: '[itemprop="articleBody"], .description, [itemprop="description"]',
                    ignoreTexts: ["توضیحات :"]
                },
                tags: (_, fullHtml: HTMLElement) => {
                    const tags = fullHtml.querySelectorAll(".article__tag, .tag-title a[href]")
                    return tags
                },
                category: {
                    selector: (_, fullHtml: HTMLElement) => fullHtml.querySelectorAll(".breadcrumb a"),
                    startIndex: 1
                },
                datetime: {
                    conatiner: '[itemprop="datePublished"], .section .number.side, [itemprop="dateCreated"], .created-post .date',
                    splitter: (el: HTMLElement) => el.innerText.includes('پیش') || el.innerText.includes('امروز') || el.innerText.includes('قبل') ? dateOffsetToDate(el) : (super.extractDate(el, " ") || "NO_DATE")
                },
                comments: {
                    container: (article: HTMLElement) => article.querySelectorAll(".comment, article.topic-post"),
                    author: ".username, .nickname",
                    datetime: ".user-time, .date",
                    text: ".comment__content, .post-message"
                }
            },
        })
    }

    normalizePath(url: URL) {
        if (url.pathname.startsWith("/video/") || url.pathname.startsWith("/photo/"))
            return super.normalizePath(url, { pathToCheckIndex: 1, validPathsItemsToNormalize: ["video", "photo"] })
        else if (url.pathname.startsWith("/clinic/question/") || url.pathname.startsWith("/discussion/topic/")) {
            const pathParts = url.pathname.split("/")
            if (pathParts.length > 3)
                return url.protocol + "//" + url.hostname + `/${pathParts[1]}/${pathParts[2]}/${pathParts[3]}/` + url.search
        }
        return url.toString()
    }
}

export class lastsecond extends clsScrapper {
    constructor() {
        super(enuDomains.lastsecond, "lastsecond.ir", {
            selectors: {
                article: ".post-show__content, .travelogue-show__content, .video-show",
                title: ".title",
                content: {
                    main: '.post-show__content__body>*, .travelogue-show__content__body>*, .video-show__content',
                    ignoreTexts: ["توضیحات :"],
                    ignoreNodeClasses: ["toc"]
                },
                datetime: {
                    conatiner: '.details__date',
                    splitter: " "
                },
                comments: async (url: URL, reqParams: IntfRequestParams): Promise<IntfComment[]> => {
                    const comments: IntfComment[] = []
                    const retrieveComments = async (page: number) => {
                        await axiosPost(log,
                            { "commentableType": "post", "commentableId": url.pathname.replace("/blog/", "").split("-")[0], page, "sort": 1 },
                            {
                                ...reqParams,
                                url: "https://api.lastsecond.ir/comments/comments/index",
                                headers: {
                                    "Content-Type": "application/json; charset=UTF-8"
                                },
                                onSuccess: async (res: any) => {
                                    res?.forEach((item: any) => {
                                        comments.push({
                                            text: normalizeText(item.content) || "",
                                            author: normalizeText(item.user.fullName),
                                        })
                                        item.children?.forEach((child: any) => {
                                            comments.push({
                                                text: normalizeText(child.content) || "",
                                                author: normalizeText(item.user.fullName),
                                            })
                                        })
                                    })
                                    if(res?.pagination?.hasMorePages)
                                        await retrieveComments(res?.pagination?.current + 1)
                                },
                                onFail: (e) => { log.error(e) }
                            }
                        )
                    }

                    await retrieveComments(1)

                    return comments
                },
            },
        })
    }
}