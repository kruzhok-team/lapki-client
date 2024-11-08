/*
Taken from https://github.com/shaaijs/html-element-to-react/
Licensed with MIT License

Copyright (c) 2019 Shaai

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

import React, { ReactNode } from 'react';

function camelCase(s, delimiter) {
  const a = s.split(delimiter);
  return delimiter + a[1].slice(0, 1).toUpperCase() + a[1].slice(1, a[1].length);
}

function getProps(el) {
  let props = {};

  const events = {};
  for (const k in el) {
    if (/^on/.test(k) && el[k]) {
      events[camelCase(k, 'on')] = el[k];
    }

    if (k === 'className' && el[k]) {
      props[k] = el[k];
    }

    if (k === 'src' && el[k]) {
      props[k] = el[k];
    }
  }
  props = Object.assign(props, events);
  return props;
}

function getChildren(elements) {
  const children: ReactNode[] = [];
  if (!elements) return children;
  for (let i = 0; i < elements.length; i++) {
    const el = elements[i];
    const props = { ...getProps(el) };

    if (el.childNodes.length) {
      children.push(
        React.createElement(
          el.tagName.toLowerCase(),
          Object.keys(props).length === 0 ? null : props,
          ...getChildren(el.childNodes)
        )
      );
    } else {
      if (el.nodeType === 3) {
        children.push(el.textContent);
      } else if (el.nodeType === 1) {
        if (['VIDEO', 'IMG', 'AUDIO'].includes(el.nodeName)) {
          children.push(
            React.createElement(
              el.tagName.toLowerCase(),
              Object.keys(props).length === 0 ? null : props
            )
          );
        }
      }
    }
  }

  return children;
}

export const convert = function (domElement) {
  if (!domElement) return null;
  const props = { ...getProps(domElement) };
  return React.createElement(
    domElement.tagName.toLowerCase(),
    Object.keys(props).length === 0 ? null : props,
    ...getChildren(domElement.childNodes)
  );
};
