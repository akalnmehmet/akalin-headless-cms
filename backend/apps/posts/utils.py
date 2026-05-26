import nh3

ALLOWED_TAGS = {
    "p", "h1", "h2", "h3", "h4", "h5", "h6",
    "pre", "code", "img", "a", "ul", "ol", "li",
    "blockquote", "strong", "em", "b", "i", "u",
    "table", "thead", "tbody", "tr", "td", "th",
    "span", "div", "section", "article", "br", "hr",
}

# nh3'de "rel" link_rel parametresiyle ayrıca kontrol edilir, attributes'a koyulmaz.
# "*" wildcard desteklenmez; her tag için ayrı belirtilir.
ALLOWED_ATTRS = {
    "a": {"href", "target"},
    "img": {"src", "alt", "class", "width", "height", "loading"},
    "span": {"class"},
    "div": {"class"},
    "p": {"class"},
    "code": {"class"},
    "pre": {"class"},
    "td": {"class"},
    "th": {"class"},
}


def sanitize_html(raw_html: str) -> str:
    # nh3 otomatik olarak <a> etiketlerine rel="noopener noreferrer" ekler
    return nh3.clean(raw_html, tags=ALLOWED_TAGS, attributes=ALLOWED_ATTRS)
