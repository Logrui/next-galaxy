export default function sayHello(): void {
  if (typeof window === 'undefined') return; // SSR safety
  
  if (navigator.userAgent.toLowerCase().indexOf('chrome') > -1) {
    const args = [
      '\n %c Made with ❤️ by Rivercode %c http://www.riverco.de/ %c %c 🐳 \n\n',
      'border: 1px solid #000;color: #000; background: #fff001; padding:5px 0;',
      'color: #fff; background: #1c1c1c; padding:5px 0;border: 1px solid #000;',
      'background: #fff; padding:5px 0;',
      'color: #b0976d; background: #fff; padding:5px 0;'
    ];
    console.log.apply(console, args);
  } else if (window.console) {
    console.log('Made with love ❤️ Riverco.de - http://www.riverco.de/  ❤️');
  }
}
