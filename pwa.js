(() => {
  'use strict';
  const install = document.getElementById('installApp');
  const shortcut = document.getElementById('shortcutHelp');
  const dialog = document.getElementById('installDialog');
  const title = document.getElementById('installTitle');
  const instructions = document.getElementById('installInstructions');
  const status = document.getElementById('installStatus');
  const display = window.matchMedia('(display-mode: standalone)');
  let promptEvent = null;
  let installed = false;
  const standalone = () => display.matches || navigator.standalone === true;
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  function show(heading, text) {
    title.textContent = heading;
    instructions.textContent = text;
    if (!dialog.open) dialog.showModal();
  }
  function update() {
    install.disabled = installed || standalone();
    install.textContent = standalone() ? 'האפליקציה פתוחה בחלון עצמאי' : installed ? 'האפליקציה הותקנה' : 'התקנת אפליקציה — PWA';
  }
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    promptEvent = event;
    update();
  });
  window.addEventListener('appinstalled', () => {
    installed = true;
    promptEvent = null;
    status.textContent = 'האפליקציה הותקנה. אפשר לפתוח אותה מהסמל במסך הבית או ברשימת האפליקציות.';
    update();
  });
  if (display.addEventListener) display.addEventListener('change', update);
  document.getElementById('closeInstall').onclick = () => dialog.close();
  shortcut.onclick = () => show('קיצור דרך שפותח בדפדפן', ios
    ? 'באייפון: פתח את האתר ב־Safari, לחץ שיתוף (Share), ואז הוספה למסך הבית (Add to Home Screen). אם מופיע המתג Open as Web App, כבה אותו כדי ליצור קיצור דרך. האפשרויות תלויות בגרסת המכשיר.'
    : 'ב־Chrome באנדרואיד: פתח את האתר בדפדפן ולחץ על שלוש הנקודות ⋮. בחר Install and create shortcut (התקנה ויצירת קיצור דרך), ואז Create shortcut (יצירת קיצור דרך) ו־Add (הוספה). בחלק מהגרסאות התפריט נקרא Add to Home screen (הוספה למסך הבית). בחר יצירת קיצור דרך. במחשב אפשר לשמור סימנייה או להשתמש באפשרות יצירת קיצור דרך בתפריט הדפדפן. אפשר לשמור גם קיצור דרך וגם אפליקציה.');
  install.onclick = async () => {
    if (installed || standalone()) return;
    if (!promptEvent) {
      show('התקנת מסלולי הצדקה', ios
        ? 'פתח את האתר ב־Safari, לחץ שיתוף (Share), ואז הוספה למסך הבית (Add to Home Screen) והוסף (Add). אם מופיע Open as Web App, השאר אותו פעיל.'
        : 'פתח את האתר ב־Chrome ולחץ ⋮ ← Install and create shortcut או Add to Home screen ← Install (התקנה). במחשב חפש התקנת אפליקציה בתפריט או בשורת הכתובת. אם התקנה עדיין אינה מוצעת, רענן את האתר ונסה שוב לאחר זמן קצר. ייתכן שהיא כבר מותקנת או שהדפדפן אינו תומך בכך.');
      return;
    }
    const event = promptEvent;
    promptEvent = null;
    install.disabled = true;
    try {
      await event.prompt();
      const choice = await event.userChoice;
      status.textContent = choice.outcome === 'accepted'
        ? 'בקשת ההתקנה אושרה. המתן לסיום ההתקנה בדפדפן.'
        : 'ההתקנה בוטלה. אפשר להמשיך להשתמש באתר ולנסות שוב מתפריט הדפדפן.';
    } catch (_) {
      status.textContent = 'לא ניתן לפתוח התקנה אוטומטית כרגע. נסה להתקין מתפריט הדפדפן.';
    } finally { update(); }
  };
  update();
  if ('serviceWorker' in navigator && window.isSecureContext && location.protocol !== 'file:') {
    navigator.serviceWorker.register('./sw.js', { scope: './', updateViaCache: 'none' }).catch(() => {
      status.textContent = 'שמירת האפליקציה לפתיחה ללא רשת לא הושלמה. אפשר להמשיך באתר. אם התקלה חוזרת, בדוק שכל קובצי העדכון הועלו.';
    });
  }
})();
