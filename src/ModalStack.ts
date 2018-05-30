declare global {
  interface Window { micromodals: any; }
  interface Promise<T> { finally: Function; }
}

type ModalResult = {
  dismissed: boolean,
  value: any | undefined
};

export default class ModalStack {
	_stackId: string;

  /**
   * @param {object} [Options]
   * @param {string} [Options.stackId='global']  The name of the modal stack in the DOM.
   */
  constructor({ stackId = 'global' } = {}) {
    this._stackId = stackId;
    window.addEventListener('keypress', this._onWindowKeyPress.bind(this));
    window.addEventListener('click', this._onWindowClick.bind(this));
  }

  /**
   * Opens a modal, loading it from the given URL.
   *
   * @param {object}  Options
   * @param {string}  Options.url                The url from which to load the modal HTML.
   * @param {boolean} [Options.dismissable=true] Whether to dismiss the modal when the user presses escape, or clicks outside of it.
   *
   * @return {Promise} A promise that is resolved when the modal closes, or rejected when the modal is dismissed.
   */
  openModal({ url, dismissable = true }: { url: string, dismissable: boolean }) {
    const id = this._generateId();

    const promise = new Promise<ModalResult>((resolve, reject) => {
      this._registerCallback(id, resolve);
      const requestUrl = new URL(url);
      requestUrl.searchParams.set('callback', id)
      fetch(requestUrl.toString()).then(response => response.text()).then(html => {
        this._addModalToDom(id, html, dismissable);
      });
    })

    promise.finally(() => {
      this._unregisterCallback(id);
      this._removeModalFromDom(id);
    });

    return promise;
  }

  closeModal(id: string, dismissed: boolean, value: any | undefined = undefined) {
    if(dismissed) {
      window.micromodals[id]._dismiss();
    } else {
      window.micromodals[id].close(value);
    }
  }

  _registerCallback(id: string, resolve) {
    window.micromodals = window.micromodals || {};
    window.micromodals[id] = {
      close: (value) => {
        let parsedValue;
        try {
          parsedValue = JSON.parse(value)
        } catch {
          parsedValue = value;
        }
        resolve({ dismissed: false, value: parsedValue })
      },
      _dismiss: () => resolve({ dismissed: true })
    };
  }

  _unregisterCallback(id: string) {
    delete window.micromodals[id];
  }

  _generateId(): string {
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
    const modalContent = document.createElement('div');
    modalContent.classList.add('micromodal__modal__content');
    modalContent.innerHTML = html;
    for(const element of modalContent.querySelectorAll('[data-modal-close]')) {
      element.addEventListener('click', () => {
        this.closeModal(id, false, (<HTMLElement>element).dataset.modalClose)
      });
    }

    const modalWrapper = document.createElement('div');
    modalWrapper.classList.add('micromodal__modal');
    modalWrapper.dataset.modalId = id;
    if(dismissable) {
      modalWrapper.dataset.modalDismissable = dismissable.toString();
    }
    modalWrapper.appendChild(modalContent);

    this._modalsContainer.appendChild(modalWrapper);
  }

  _removeModalFromDom(id: string) {
    const modalElement = this._findModalWithId(id);
    if(!modalElement) {
      throw `Modal with id ${id} does not exist in the DOM.`;
    }
    this._modalsContainer.removeChild(modalElement);
    if(this._modalsContainer.children.length === 0) {
      // @ts-ignore
      this._modalsContainer.innerHTML = null;
    }
  }

  _findModalWithId(id: string): HTMLElement | null {
    return this._modalsContainer.querySelector(`[data-modal-id="${id}"]`);
  }

  get _modalsContainer(): HTMLElement {
    const container = document.querySelector(`[data-modals-stackid="${this._stackId}"]`);
    if(container instanceof HTMLElement === false) {
      throw `Modal container with stack-id ${this._stackId} does not exist.`;
    }
    return <HTMLElement>container;
  }

  get _frontMostModal(): HTMLElement {
    return <HTMLElement>this._modalsContainer.lastElementChild;
  }
}
