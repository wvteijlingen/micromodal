# micromodal

A small library to load and show modals using `fetch`, and handle their return values using Promises.

## Example

```javascript
// Somewhere in your HTML:
// <div class="modals" data-modals-stackid="global"></div>

const modals = new micromodal.ModalStack({ stackid: 'global' });

modals.openModal({
  url: 'http://example.com/modals/terms-of-service',
  dismissable: true
}).then(result => {
  if(result.dismissed) {
    alert('You dismissed the modal')
  } else if(result.value === 'accepted') {
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
`openModal` will return a Promise that will be resolved when the modal closes.

```javascript
const options = {
  url: 'http://example.com/modals/terms-of-service', // The URL that returns the modal content.
  dismissable: true // Whether the modal can be dismissed by clicking outside it or pressing ESC.
};

window.modals.openModal(options).then(result => {
  if(result.dismissed) {
    alert('You dismissed the modal')
  } else if(result.value === 'accepted') {
    alert('You accepted our terms of service');
  } else {
    alert('You rejected our terms of service');
  }
});
```

## #openModal returns a promise
Each modal can return a value when it is closed. For example: A modal that asks for confirmation,
can return `true` or `false` depending on whether the user clicked 'yes' or 'no'.
A modal that prompts for text input can resolve with the string entered by the user, or `false` when the user clicks cancel.
You can decide what return value makes the most sense for each modal.

The fulfilled value of the promise contains two properties:
- `dismissed`: This is `true` if the modal is dimissed, i.e. the user clicked outside of the modal or pressed the escape key on the keyboard.
- `value`: The value returned by the model. This will be `undefined` if the modal is dismissed.

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
window.micromodals(callbackParameter).close('some value');
```

## Using multiple modal stacks
You can have multiple modal stacks at the same time in different places in the DOM.
Just make sure you use a unique `stackid` for each stack.

This allows you to for example open a modal within a sidebar.
