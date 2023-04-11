const page = document.body;
const audio = new Audio();


function player (audioSrc, color, x, y) {
  const fileName = audioSrc.split('/').pop();
  
  // Make a track with a panner and a gain node.
  const track = audio.createTrack(audioSrc);


  // Make all the elements needed.
  const container = create({
    tag: 'div',
    className: 'player-container',
  });
  container.style.backgroundColor = color;
  container.style.left = `calc(50% + ${x}px)`
  container.style.top = `calc(50% + ${y}px)`

  const fileLabel = create({
    tag: 'p',
    className: 'filename',
    innerText: fileName,
  });

  const audioElem = create({
    tag: 'audio',
    src: audioSrc,
    loop: true,
  });

  const button = create({
    tag: 'button',
    className: 'player-button'
  });

  const slider = create({
    tag: 'input',
    type: 'range',
    className: 'volume-slider',
    min: 0,
    max: 60, 
    value: 60,
  });


  const flexRow = create({
    tag: 'div',
    className: 'flex-row',
  })


  

  button.onclick = () => {
    if (button.dataset.state === 'playing') {
      track.stop();
      button.dataset.state = 'paused';
      container.classList.remove('playing');
    } else { 
      track.play();
      button.dataset.state = 'playing';
      container.classList.add('playing');
    }
  }

  button.dataset.playing = false;


  // 
  slider.onmousedown = button.onmousedown = (e) => {
    e.stopPropagation();
  }

  slider.oninput = (e) => {
    let val = parseFloat(slider.value) / 60;
    track.gain = val;
  }

  flexRow.append(button, slider, fileLabel);
  container.append(flexRow, audioElem);
  page.append(container);


  draggable(container, (x, y) => {
    // Remap y from 0 to 1 (bottom to top) from -3 to +3 to and use p
    let y2 = Math.pow(2, (3 * ((1 - y) * 2 - 1)));
    console.log(y2);
    track.speed = y2;
    track.pan = (x * 2) - 1;
  });

  return container;

}





player('/audio/bell_march11.mp3', 'pink', 0, 50);
player('/audio/green_central_knoll_march7.mp3', 'darkolivegreen', 0, 0);
player('/audio/guitar_loop_march8.mp3', 'cornsilk', 0, -50);
player('/audio/marble_tower_march12.mp3', 'lavender', 0, -100);










