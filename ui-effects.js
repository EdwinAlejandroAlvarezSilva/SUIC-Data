// UI effects: ripple on buttons and search focus animation
(function(){
  // Ripple effect for elements with .btn class
  function createRipple(event){
    const btn = event.currentTarget;
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 1.2;
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = (event.clientX - rect.left - size/2) + 'px';
    ripple.style.top = (event.clientY - rect.top - size/2) + 'px';
    ripple.style.background = getComputedStyle(btn).backgroundColor || 'rgba(255,255,255,0.35)';
    ripple.style.opacity = '0.7';
    btn.appendChild(ripple);
    // animate
    ripple.animate([
      { transform: 'scale(0)', opacity: 0.7 },
      { transform: 'scale(1.5)', opacity: 0 }
    ], { duration: 520, easing: 'cubic-bezier(.22,.9,.3,1)'}).onfinish = function(){
      ripple.remove();
    };
  }

  document.addEventListener('click', function(e){
    const btn = e.target.closest('.btn');
    if(btn) createRipple(e);
  }, { passive: true });

  // Search input subtle microinteraction: show clear icon and animate size
  document.addEventListener('DOMContentLoaded', function(){
    const search = document.querySelector('.search-input');
    if(!search) return;

    // create clear button
    const wrapper = search.closest('.search-wrapper');
    if(!wrapper) return;
    const clear = document.createElement('button');
    clear.type = 'button';
    clear.className = 'btn btn-sm btn-ghost';
    clear.style.padding = '6px 8px';
    clear.style.height = '36px';
    clear.style.display = 'none';
    clear.textContent = '✕';
    wrapper.appendChild(clear);

    search.addEventListener('input', function(){
      clear.style.display = search.value ? 'inline-flex' : 'none';
    });
    clear.addEventListener('click', function(){ search.value=''; search.dispatchEvent(new Event('input')); search.focus(); });

    // subtle pulse on focus
    search.addEventListener('focus', function(){ wrapper.classList.add('fade-in'); });
    search.addEventListener('blur', function(){ wrapper.classList.remove('fade-in'); });
  });
})();
