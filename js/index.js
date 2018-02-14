console.log('Dinesh Hyaunmikha');

function Dinesh() {
  const othis = this;

  this.main = document.getElementById('main');
  this.body = document.getElementsByTagName('body')[0];
  this.nameDiv = document.getElementsByClassName('name')[0];

  this._mouseTimer = null;
  this.led = document.getElementsByClassName('led')[0];

  led = this.led;

  this.name = '';
  this._chars = [];

  this.body.onkeypress = function(event) {
    if(event.key === "Enter") {
      othis.name = othis._chars.join('');
      if(othis.name === 'clear') {
        othis.name = 'Dinesh Hyaunmikha';
      }
      othis.nameDiv.innerText = othis.name;
      othis._chars = [];

      return;
    }

    othis._chars.push(event.key);
  }

  document.onmousemove = function(e) {
    othis.led.classList.add('led-yellow')

    clearTimeout(othis.mouseTimer);
    othis.mouseTimer = setTimeout(othis._onMouseStop, 100);
  }

  this._onMouseStop = function() {
    othis.led.classList.remove('led-yellow')
  }

}

const dinesh = new Dinesh();
