# micromodal

A small library to load and show modals using AJAX.

## Example

```javascript
// Somewhere in your HTML:
// <div class="modals" data-modals-stackid="global"></div>

const modals = new micromodal.ModalStack({ stackid: 'global' });

modals.openModal({
  url: 'http://example.com/modals/terms-of-service',
  dismissable: true
}).then(accepted => {
  if(accepted) {
     alert('You accepted our terms of service');
  } else {
    alert('You rejected our terms of service');
  }
});
```

## Usage

1. Create a div in your markup where the modals will be displayed. Give this div a `data-modal-stack` attribute.
```html
<div class="modals" data-modals-stackid="global"></div>
```

2. Initialize a ModalStack class with the stackid you entered in the HTML. If you want,
you can make this a global variable so you can open modals throughout your application.
```javascript
window.modals = new micromodal.ModalStack({ stackid: 'global' });
```

3. Open a modal by calling `openModal`, passing a URL that contains the modal HTML.
micromodal will fetch this HTML and display it in a modal in the modal stack.
`openModal` will return a Promise that will be resolved or rejected when the modal closes.
http
```javascript
const options = {
  url: 'http://example.com/modals/terms-of-service',
  dismissable: true
};

window.modals.openModal(options).then(accepted => {
  if(accepted) {
     alert('You accepted our terms of service');
  } else {
    alert('You rejected our terms of service');
  }
});
```

## Why does `openModal` return a promise?
Each modal can return a value by resolving a promise. For example: A modal that asks for confirmation (Are you sure?),
can resolve with `true` or `false` depending on whether the user clicked 'yes' or 'no'.
A modal that prompts for an input can for example resolve with the string entered by the user,
or false when the user clicks cancel. You can decide what return value makes the most sense for the modal.

You can only resolve the promise, not reject it. Even when the user clicks 'cancel',
because it is still a successful interaction with the modal. A promise is only rejected by micromodal itself when
the user dismisses the modal by clicking outside of it, or pressing escape.

## Closing a modal (with an optional return value)
Each element in your modal HTML that has a `data-modal-close` attribute will automatically close the modal when clicked.
You can optionally give this attribute a value, which will then be the result of the promise returned by `ModalStack.openModal`. Example:

```html
<button data-modal-close="yes">Yes</button>
<button data-modal-close="no">No</button>
<button data-modal-close>Cancel</button>
```

## Programatically closing a modal (with an optional return value)
If your return values are not static, or you want to close the modal programatically from within the modal,
you can use a callback that micromodal provides for you. When micromodal fetches your modal markup, it passes a GET parameter called `callback`.
You can use this parameter to close the modal from inside:

```javascript
window.modalcallbacks(callbackParameter).close('some value');
```

## Using multiple modal stacks
You can have multiple modal stacks at the same time in different places in the DOM.
Just make sure you use a unique `stackid` for each stack.

This allows you to for example open a modal within a sidebar.
