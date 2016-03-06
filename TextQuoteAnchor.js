import TextPositionAnchor from 'dom-anchor-text-position';

const CONTEXT_LENGTH = 32;


export default class TextQuoteAnchor {
  constructor(root, exact, context = {}) {
    if (root === undefined) {
      throw new Error('missing required parameter "root"');
    }
    if (exact === undefined) {
      throw new Error('missing required parameter "exact"');
    }
    this.root = root;
    this.exact = exact;
    this.prefix = context.prefix;
    this.suffix = context.suffix;
  }

  static fromRange(root, range) {
    if (range === undefined) {
      throw new Error('missing required parameter "range"');
    }

    let position = TextPositionAnchor.fromRange(root, range);
    return this.fromPositionAnchor(position);
  }

  static fromSelector(root, selector = {}) {
    return new TextQuoteAnchor(root, selector.exact, selector);
  }

  static fromPositionAnchor(anchor) {
    let root = anchor.root;

    let {start, end} = anchor;
    let exact = root.textContent.substr(start, end - start);

    let prefixStart = Math.max(0, start - CONTEXT_LENGTH);
    let prefix = root.textContent.substr(prefixStart, start - prefixStart);

    let suffixEnd = Math.min(root.textContent.length, end + CONTEXT_LENGTH);
    let suffix = root.textContent.substr(end, suffixEnd - end);

    return new TextQuoteAnchor(root, exact, {prefix, suffix});
  }

  toRange(options) {
    return this.toPositionAnchor(options).toRange();
  }

  toSelector() {
    let selector = {
      type: 'TextQuoteSelector',
      exact: this.exact,
    };
    if (this.prefix !== undefined) selector.prefix = this.prefix;
    if (this.suffix !== undefined) selector.suffix = this.suffix;
    return selector;
  }

  toPositionAnchor() {
    let root = this.root;
    let text = root.textContent;

    let pattern = quoteToRegExp(this.exact);

    // Search for the pattern.
    let start = text.search(pattern);
    if (start === -1) {
        throw new Error('no match found');
    }
    let end = start + text.match(pattern)[0].length;

    return new TextPositionAnchor(root, start, end);
  }
}

// Convert a quote to a regular expression to find the quoted text.
function quoteToRegExp(string) {
    function regexEscape(string) {
        return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    }
    let escapedString = regexEscape(string);

    // Whitespace is whitespace, do not fuss about types and amounts of it.
    let regex = escapedString.replace(/\s+/g, '\\s+');

    // Let ellipsis match any text.
    const ellipsis = '...';
    // Escape twice: we want to find the escaped sequence '\.\.\.' in the regex.
    let escapedEllipsis = regexEscape(regexEscape(ellipsis));
    regex = regex.replace(new RegExp(escapedEllipsis, 'g'), '(?:.|[\\r\\n])+');

    return new RegExp(regex, 'g');
}
