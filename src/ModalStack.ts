import { ModalResult } from './ModalResult';

export default class ModalStack {
  _modalsContainer: HTMLElement;

  /**
   * @param {object} [Options]
   * @param {string} [Options.container]  The element that will contain the modals in the DOM.
   */
  constructor({ container }: { container: HTMLElement }) {
    this._modalsContainer = container;
    window.addEventListener('keypress', this._onWindowKeyPress.bind(this));
    container.addEventListener('click', this._onWindowClick.bind(this));
  }

  /**
   * Opens a modal, loading it from the given URL.
   *
   * @param {string}  url                The url from which to load the modal HTML.
   * @param {object}  Options
   * @param {boolean} [Options.dismissable=true] Whether to dismiss the modal when the user presses escape, or clicks outside of it.
   *
   * @return {Promise} A promise that is fulfilled when the modal closes.
   */
  openModal(url: string, { dismissable }: {dismissable: boolean } = { dismissable: true }): Promise<ModalResult> {
    const id = this._generateModalId();

    const promise = new Promise<ModalResult>((resolve, reject) => {
      fetch(url).then(response => response.text()).then(html => {
        const modalElement = this._addModalToDom(id, html, dismissable);
        modalElement.addEventListener('closemodal', (event: CustomEvent) => {
          resolve({ dismissed: false, value: event.detail });
        });

        modalElement.addEventListener('dismissmodal', (event: CustomEvent) => {
          resolve({ dismissed: true });
        });
      });
    });

    // NOTE: This would be better implemented using `finally`, but that is not supported everywhere yet.
    promise.then(() => {
      this._removeModalFromDom(id);
    }, () => {
      this._removeModalFromDom(id);
    });

    return promise;
  }

  closeModal(id: string, dismissed: boolean, value?: any) {
    const modal = this._findModalWithId(id);
    if(!modal) {
      return;
    }

    const eventName = dismissed ? 'dismissmodal' : 'closemodal';
    let eventDetail;
    try {
      eventDetail = JSON.parse(value)
    } catch {
      eventDetail = value;
    }

    modal.dispatchEvent(new CustomEvent(eventName, { detail: eventDetail , bubbles: true }));
  }

  _generateModalId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  _onWindowKeyPress(event: KeyboardEvent) {
    if(event.which === 27) { // Escape key
      const modal = this._frontMostModal;
      if(modal && modal.dataset.modalDismissable) {
        this.closeModal(<string>modal.dataset.modalId, true);
        event.preventDefault();
      }
    }
  }

  _onWindowClick(event: MouseEvent) {
    const modal = this._frontMostModal;
    const eventTarget = <Element>event.target;
    if(modal && !eventTarget.closest('.micromodal__modal__content') && modal.dataset.modalDismissable) {
      this.closeModal(<string>modal.dataset.modalId, true);
      event.preventDefault();
    }
  }

  _addModalToDom(id: string, html: string, dismissable: boolean) {
    // Create content
    const modalContent = document.createElement('div');
    modalContent.classList.add('micromodal__modal__content');
    modalContent.setAttribute('role', 'dialog');
    modalContent.appendChild(this._convertHTMLtoDocumentFragment(html));

    // Add listeners for nodes with data-modal-close attribute
    for(const element of modalContent.querySelectorAll('[data-modal-close]')) {
      element.addEventListener('click', event => {
        const value =  (<HTMLElement>element).dataset.modalClose || undefined;
        this.closeModal(id, false, value)
        event.preventDefault();
      });
    }

    // Create wrapper
    const modalWrapper = document.createElement('div');
    modalWrapper.classList.add('micromodal__modal');
    modalWrapper.dataset.modalId = id;
    if(dismissable) {
      modalWrapper.dataset.modalDismissable = dismissable.toString();
    }
    modalWrapper.appendChild(modalContent);

    this._modalsContainer.appendChild(modalWrapper);

    return modalWrapper;
  }

  _convertHTMLtoDocumentFragment(html: string): DocumentFragment {
    const fragment = document.createDocumentFragment();
    const tmp = document.createElement('div');
    tmp.innerHTML = html;

    for(const node of tmp.childNodes) {
      let newNode;
      if(node instanceof HTMLElement && node.tagName.toLowerCase() === 'script') {
        newNode = document.createElement('script');
        newNode.innerHTML = node.innerHTML;
      } else {
        newNode = node;
      }
      fragment.appendChild(newNode);
    }
    return fragment;
  }

  _removeModalFromDom(id: string) {
    const modalElement = this._findModalWithId(id);
    if(!modalElement) {
      throw `Modal with id ${id} does not exist in the DOM.`;
    }
    this._modalsContainer.removeChild(modalElement);
  }

  _findModalWithId(id: string): HTMLElement | null {
    return this._modalsContainer.querySelector(`[data-modal-id="${id}"]`);
  }

  get _frontMostModal(): HTMLElement | null {
    return <HTMLElement>this._modalsContainer.lastElementChild;
  }
}
