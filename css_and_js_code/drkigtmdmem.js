// Remember darkmode/lightmode
<script>
  const isDark = localStorage.getItem('darkMode') === 'true' || localStorage.getItem('darkMode') === null;
  if (isDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
