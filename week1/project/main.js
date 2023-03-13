const page = document.body;
const audio = new Audio();


function player (audioSrc, color, x, y) {
  const fileName = audioSrc.split('/').pop();
  
  // Make a track with a panner and a gain node.
  const track = audio.addBufferFromSource(audioSrc, { pan: true, gain: true });


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
      track.pause();
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
    track.setGain(val);
  }

  flexRow.append(button, slider, fileLabel);
  container.append(flexRow, audioElem);
  page.append(container);


  draggable(container, (x, y) => {
    track.setSpeed((1 - y) * 2);
    track.setPan((x * 2) - 1);
  });

  return container;

}


player('/source/bell_march11.mp3', 'pink', 0, 50);
player('/source/green_central_knoll_march7.mp3', 'darkolivegreen', 0, 0);
player('/source/guitar_loop_march8.mp3', 'cornsilk', 0, -50);
player('/source/marble_tower_march12.mp3', 'lavender', 0, -100);










