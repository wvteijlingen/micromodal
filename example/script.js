const modals = new micromodal.ModalStack({
  container: document.getElementById('modals')
});

document.getElementById('button-confirmation').addEventListener('click', () => {
  modals.openModal({
    url: 'http://127.0.0.1:8080/modal-confirm.html',
    dismissable: true
  }).then(result => {
    if(result.dismissed) {
      alert('You dismissed the modal');
    } else if(result.value === true) {
      alert('You clicked yes');
    } else {
      alert('You clicked no');
    }
  });
});

document.getElementById('button-input').addEventListener('click', () => {
  modals.openModal({
    url: 'http://127.0.0.1:8080/modal-input.html',
    dismissable: true
  }).then(result => {
    if(result.dismissed) {
      alert('You dismissed the modal');
    } else if(result.value === undefined) {
      alert('You clicked cancel');
    } else {
      alert(`Hi ${result.value}!`);
    }
  });
});
