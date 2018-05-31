import { ModalResult } from './ModalResult';

type ModalCallback = {
  close: (any) => void,
  _dismiss: () => void
}

declare global {
  interface Window {
    micromodals: Map<string, ModalCallback>
  }
  interface Promise<T> {
    finally: Function;
  }
}

export default class ModalStack {
  _modalsContainer: HTMLElement;

  /**
   * @param {object} [Options]
   * @param {string} [Options.container]  The element that will contain the modals in the DOM.
   */
  constructor({ container }: { container: HTMLElement }) {
    this._modalsContainer = container;
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
   * @return {Promise} A promise that is fulfilled when the modal closes.
   */
  openModal({ url, dismissable = true }: { url: string, dismissable: boolean }) {
    const id = this._generateModalId();

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

  closeModal(id: string, dismissed: boolean, value?: any) {
    if(dismissed) {
      window.micromodals[id]._dismiss();
    } else {
      window.micromodals[id].close(value);
    }
  }

  _registerCallback(id: string, resolve) {
    window.micromodals = window.micromodals || new Map();
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
    window.micromodals.delete(id);
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
    const modalContent = document.createElement('div');
    modalContent.classList.add('micromodal__modal__content');
    modalContent.innerHTML = html;
    modalContent.setAttribute('role', 'dialog');
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

  get _frontMostModal(): HTMLElement | null {
    return <HTMLElement>this._modalsContainer.lastElementChild;
  }
}
