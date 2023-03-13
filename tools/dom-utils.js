
function create (info) {
  
  const tag = info.tag || 'div';
  const elem  = document.createElement(tag);

  for (const [ prop, value ] of Object.entries(info)) {
    
    if (prop === 'children') {
      value.forEach(child => elem.append(child));  
    }
    
    if (prop === 'tag') continue;

    elem[prop] = value;
  }

  return elem;
}



function draggable (elem, ondrag = (x, y) => {}) {
  let x = 0, y = 0;
  let rect;


  const mousemove = (e) => {
    x += e.movementX;
    x = Math.max(x, 0);
    x = Math.min(x, window.innerWidth - rect.width);

    y += e.movementY;
    y = Math.max(y, 0);
    y = Math.min(y, window.innerHeight - rect.height);

    elem.style.left = x + 'px';
    elem.style.top  = y + 'px';

    let nx = x / (window.innerWidth - rect.width);
    let ny = y / (window.innerHeight - rect.height);

    ondrag(nx, ny);
  };

  const mouseup = (e) => {
    document.onmousemove = null;
    document.onmouseup = null;
    elem.style.zIndex = 0;
  }

  elem.onmousedown = (e) => {
    e.preventDefault();
    rect = elem.getBoundingClientRect();
    document.body.append(elem);
    x = rect.x;
    y = rect.y;
    document.onmousemove = mousemove;
    document.onmouseup = mouseup;
  };


}