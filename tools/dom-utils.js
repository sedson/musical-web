/**
 * Create a DOM element from a object full of options. The keys in the object 
 * should be the camel-cased JS versions ot HTML properties.
 * @param {object} info The info to make the elemnent with.
 * @example 
 * // Create a p tag with the id 'banner', the className 'my-paragraph' etc.
 * create({
 *   tag: 'p',
 *   className: 'my-paragraph',
 *   id: 'banner',
 *   innerText: 'What's Up!'
 * });
 */ 
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


/**
 * Make an element draggable. 
 * @param {HTMLElement} elem The element
 * @param {function(x, y)} ondrag A function to call when the element is dragged. 
 *     The function will be called whenever the element is dragged and can accept 
 *     an X, Y position which will be the normalized location of the element 
 *     within the window.
 * 
 * @example
 * 
 */ 
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