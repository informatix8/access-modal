# Access Modal

A modal service with accessibility considerations.

Examples and the API are in the [documentation](https://access-modal.com)

## Features
- <kbd>Esc</kbd> closes the modal
- <kbd>Shift</kbd> + <kbd>Tab</kbd> brings focus to the browser chrome once modal is open, i.e. it is the first element in the DOM
    - *Note:* tabbing should move focus within the DOM in a loop - the only way out to the browser is with **Shift+Tab** when you’re at the first focusable element in the DOM.
- **Role** on the chrome must be `dialog` or `alertdialog` where `alertdialog` signifies more importance
- **Role=document** on the modal content so screen readers begin reading it. Optional, but on by default.
- Demonstrate **aria-labelledby** to point to the modal title bar
- Demonstrate **aria-describedby** to tell the user where the beginning of the modal content is
- Demonstrate a good **aria-label** and on the close button along with a good description linked with **aria-describedby**
- Disallow focus to reach outside the modal content
- Remember last focused element before opening and return focus there upon closing
- Disallow screen readers to read outside the modal content - achieved with an all encompassing wrapper and applying **aria-hidden**
- Set proper **tabindex** on the modal chrome and content: per W3C specification: the modal chrome (AKA backdrop or overlay) is inoperable, therefore tabindex="-1"
- Focus the modal content upon open

### Other Features
- Support for modal within a modal
- User defined callbacks for pre/post open and close events

## Usage

### Install

```shell
npm install @informatix8/access-modal --save-dev
```

### CDN

```html
<script src="https://unpkg.com/@informatix8/access-modal/dist/access-modal.all.umd.js"></script>
```

## Development

```shell
npm run dev
```

## Build

```shell
npm run build
```

## Release

```shell
npm run build
git tag -a vX.Y.Z
git push origin master
git push origin --tags
npm publish --access=public .
```
