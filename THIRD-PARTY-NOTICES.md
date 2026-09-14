# Third-party notices

The Midnight Indigo extension is [MIT licensed](LICENSE). Its icon set draws two
kinds of outline from the artwork below:

- the **language and tool marks**, imported by
  [`tools/import-marks.ts`](tools/import-marks.ts) into
  [`tools/mark-paths.ts`](tools/mark-paths.ts);
- the **pictograms** — the shapes that say what a file does rather than which
  project owns it — imported from [Iconify](https://iconify.design) by
  [`tools/import-pictograms.ts`](tools/import-pictograms.ts) into
  [`tools/pictogram-paths.ts`](tools/pictogram-paths.ts).

Everything else in the set is original to this repository: the palettes and the
colour derivations, the box and the measured centring, the duotone split applied
to the imported artwork, the shadow, the folder facade and its light beam, and
every decision about which drawing means which file.

## Simple Icons 16.29.0 — CC0-1.0

<https://simpleicons.org> · <https://github.com/simple-icons/simple-icons>

Released into the public domain under
[CC0 1.0 Universal](https://creativecommons.org/publicdomain/zero/1.0/). No
attribution is required; it is given because the work deserves it.

## devicon v2.17.0 — MIT

<https://github.com/devicons/devicon>

Used for the marks that are genuinely multi-colour (Python, Java, Dart, Vue, the
HTML5 shield, C#, Azure), with gradients flattened to the brands' flat colours.

```
MIT License

Copyright (c) 2015 konpa

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
```

## Phosphor 2.1.1 — MIT

<https://phosphoricons.com> · <https://github.com/phosphor-icons/core>

The source of all but two of the pictograms, at its `duotone` weight (and, for
the brackets, at `bold` — a duotone bracket is a blob at 16px). Phosphor is
drawn on a 256 grid with round caps and joins, which is most of why it was
chosen: this set's rule has always been that nothing of its own comes to a bare
point, and Phosphor keeps that rule for it.

```
MIT License

Copyright (c) 2023 Phosphor Icons

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
```

## Fluent UI System Icons — MIT

<https://github.com/microsoft/fluentui-system-icons>

One pictogram: the subtitle card. Phosphor's is an outline with two hairlines
in it, and at the size the file explorer draws an icon it is a blank rectangle.

## MingCute — Apache-2.0

<https://github.com/Richard9394/MingCute>

One pictogram: the commit node, for the same reason — a commit drawn as a ring
on a hairline does not survive being 16 pixels tall.

## Trademarks

The logos the icons depict are the trademarks of their respective owners. They
are used here to identify the file types they belong to — a nominative use — and
neither the extension nor its author is affiliated with, endorsed by or
sponsored by any of them. Marks whose artwork is not redistributable (Microsoft
PowerShell, Excel, Word and PowerPoint) are drawn from scratch in this
repository rather than imported.
