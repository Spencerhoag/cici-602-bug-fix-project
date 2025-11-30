import pytest
from app.server import extract_code_only


def test_extracts_fenced_code():
    text = """
    Here is the function:

    ```python
    print("hello")
    ```
    """
    assert extract_code_only(text) == 'print("hello")'


def test_extracts_fenced_code_no_language():
    text = """
    ```
    x = 10
    print(x)
    ```
    """
    assert extract_code_only(text) == """x = 10
    print(x)"""


def test_strips_explanations_before_and_after():
    text = """
    Here is the corrected version:

    ```python
    a = 1
    b = 2
    print(a + b)
    ```

    This should fix the issue.
    """
    assert extract_code_only(text) == """a = 1
    b = 2
    print(a + b)"""


def test_handles_no_fence_removes_bad_lines():
    text = """
    Here is what the code should look like:
    The code below is corrected:

    x = 5
    y = 6
    print(x + y)
    """
    assert extract_code_only(text) == """x = 5
    y = 6
    print(x + y)"""


def test_empty_string():
    assert extract_code_only("") == ""


def test_no_special_lines():
    text = "print('hello world')"
    assert extract_code_only(text) == "print('hello world')"
