function createGuiPart (elem) {
  const obj = {
    elem: elem,
    handler: null,
  };
  obj.link = fn => {
    obj.handler = fn;
    console.log(obj)
  }
  return obj;
}


export class GuiKit {
  constructor (container) {
    /**
     * The containing element.
     */ 
    this.panel = container;

    this.panel.onmouseleave = () => this.dragend();

    this.dragStartPos = { x: 0, y: 0 };
    this.dragTarget = null;

    this.dragScale = 100;
  }


  ondrag (e) {
    if (!this.dragTarget) return;

    const dx = e.clientX - this.dragStartPos.x;
    const dy =  e.clientY - this.dragStartPos.y;
    const d = dx + (- dy);

    this.dragListener(d / this.dragScale);
  }

  clamp (val, min = 0, max = 1) {
    return Math.min(Math.max(min, val), max);
  }


  dragstart (elem, x, y) {
    this.dragStartPos.x = x; 
    this.dragStartPos.y = y;
    this.dragTarget = elem;
    this.dragTarget.elem.classList.add('active');

    this.panel.onmousemove = (e) => this.ondrag(e);
    this.panel.onmouseup = (e) => this.dragend(e);
  }

  dragend () {
    if (this.dragTarget) {
      this.dragTarget.elem.classList.remove('active');
    }
    this.dragTarget = null;
    this.panel.onmouseup = null;
    this.panel.onmousemove = null;
  }


  /**
   * Create a DOM element from a object full of options. The keys in the object 
   * should be the camel-cased JS versions ot HTML properties.
   * @param {object} info The info to make the elemnent with.
   */ 
  create (info) {
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


  numbox () {
    const elem = this.create({
      tag: 'div', 
      className: 'gk-elem numbox',
      innerText: 0, 
    });

    const guiPart = createGuiPart(elem);
    
    elem.onmousedown = (e) => {
      this.dragstart(guiPart, e.clientX, e.clientY);
      const initialVal = parseFloat(elem.dataset.val);
      this.dragListener = (delta) => {
        const newVal = this.clamp(initialVal + delta);
        elem.innerText = newVal;
        elem.dataset.val = newVal;
      }
    }

    elem.dataset.val = 0;
    this.panel.append(elem);
    return guiPart;
  }

  
  slidebox () {
    const elem = this.create({
      tag: 'div', 
      className: 'gk-elem slidebox',
    });

    const innerElem = this.create({
      tag: 'div',
      className: 'slidebox-fill',
    })

    elem.append(innerElem);
    const guiPart = createGuiPart(elem);

    
    elem.onmousedown = (e) => {
      this.dragstart(guiPart, e.clientX, e.clientY);
      const initialVal = parseFloat(elem.dataset.val);
      this.dragListener = (delta) => {
        const newVal = this.clamp(initialVal + delta);
        if (guiPart.handler) {
          guiPart.handler(this.clamp(initialVal + delta));
        }
        innerElem.style.width = newVal * 100 + '%';
        elem.dataset.val = newVal;
      }
    }

    elem.dataset.val = 0;
    this.panel.append(elem);
    return guiPart;
  }

  dial () {
    const dialContainer = this.create({
      tag: 'div',
      className: 'gk-elem dial'
    });

    const notch = this.create({
      tag: 'div',
      className: 'gk-elem dial-notch'
    })
    dialContainer.append(notch);
    const guiPart = createGuiPart(dialContainer);


    dialContainer.onmousedown = (e) => {
      this.dragstart(guiPart, e.clientX, e.clientY);
      const initialVal = parseFloat(dialContainer.dataset.val);
      this.dragListener = (delta) => {
        const newVal = this.clamp(initialVal + delta);
        notch.style.transform = `rotate(${ newVal * 270 - 135 }deg)`;
        dialContainer.dataset.val = newVal;
      }
    }

    dialContainer.dataset.val = 0;

    this.panel.append(dialContainer);
    return guiPart;
  }

}








