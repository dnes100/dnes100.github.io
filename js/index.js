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
