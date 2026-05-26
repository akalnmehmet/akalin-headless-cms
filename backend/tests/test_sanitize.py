import pytest

from apps.posts.utils import sanitize_html


@pytest.mark.parametrize("payload,should_be_clean", [
    ("<script>alert('xss')</script>", True),
    ('<img src=x onerror=alert(1)>', True),
    ('<a href="javascript:alert(1)">click</a>', True),
    ("<iframe src='evil.com'></iframe>", True),
    ('<form action="evil.com"><input name="password"></form>', True),
    ("<object data='evil.swf'></object>", True),
])
def test_dangerous_tags_removed(payload, should_be_clean):
    result = sanitize_html(payload)
    assert "<script" not in result
    assert "onerror" not in result
    assert "javascript:" not in result
    assert "<iframe" not in result
    assert "<form" not in result
    assert "<object" not in result


def test_allowed_tags_preserved():
    html = "<p>Merhaba <strong>dünya</strong></p>"
    result = sanitize_html(html)
    assert "<p>" in result
    assert "<strong>" in result


def test_allowed_link_preserved():
    html = '<a href="https://example.com" target="_blank">Link</a>'
    result = sanitize_html(html)
    assert 'href="https://example.com"' in result


def test_empty_string():
    assert sanitize_html("") == ""


def test_plain_text_unchanged():
    text = "Bu düz bir metin."
    result = sanitize_html(text)
    assert "Bu düz bir metin." in result
