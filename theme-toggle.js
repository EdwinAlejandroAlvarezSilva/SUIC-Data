const toggleBtn = document.getElementById('toggle-theme');
const icon = document.getElementById('theme-icon');
const body = document.body;


// Restaurar tema desde localStorage
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
  body.classList.add('dark-theme');
  icon.textContent = '🌞';
} else {
  body.classList.add('light-theme');
  icon.textContent = '🌙';
}

toggleBtn.addEventListener('click', () => {
  if (body.classList.contains('dark-theme')) {
    body.classList.replace('dark-theme', 'light-theme');
    icon.textContent = '🌙';
    localStorage.setItem('theme', 'light');
  } else {
    body.classList.replace('light-theme', 'dark-theme');
    icon.textContent = '🌞';
    localStorage.setItem('theme', 'dark');
  }
});
