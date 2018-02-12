console.log('Dinesh Hyaunmikha');

let mouseTimer = null;

document.onmousemove = function(e) {
  let led = document.getElementById('led');
  led.classList.add('led-yellow')

  clearTimeout(mouseTimer);
  mouseTimer = setTimeout(onMouseStop, 100);
}

onMouseStop = function() {
  let led = document.getElementById('led');
  led.classList.remove('led-yellow')
}

function Dinesh() {
  const othis = this;

  this.main = document.getElementById('main');
  this.body = document.getElementsByTagName('body')[0];

  this.name = '';
  this._chars = [];

  this.body.onkeypress = function(event) {
    if(event.key === "Enter") {
      othis.name = othis._chars.join('');
      if(othis.name === 'clear') {
        othis.name = 'Dinesh Hyaunmikha';
      }
      othis.main.innerText = othis.name;
      othis._chars = [];

      return;
    }

    othis._chars.push(event.key);
  }

}

const dinesh = new Dinesh();
