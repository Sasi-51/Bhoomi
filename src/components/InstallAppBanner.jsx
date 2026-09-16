import { useEffect, useState } from 'react';

export default function InstallAppBanner() {
  const [installEvent, setInstallEvent] = useState(null);
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem('bhoomi_install_dismissed') === '1');

  useEffect(() => {
    const onPrompt = (e) => {
      e.preventDefault();
      setInstallEvent(e);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  if (!installEvent || dismissed) return null;

  const install = async () => {
    installEvent.prompt();
    await installEvent.userChoice;
    setInstallEvent(null);
  };

  const dismiss = () => {
    sessionStorage.setItem('bhoomi_install_dismissed', '1');
    setDismissed(true);
  };

  return (
    <div className="bg-marigold/15 border-b border-line">
      <div className="max-w-6xl mx-auto px-6 py-2.5 flex items-center justify-between gap-4 text-sm">
        <span className="text-forest font-medium">Install BHOOMI as an app for faster access and push notifications.</span>
        <div className="flex items-center gap-3 flex-shrink-0">
          <button onClick={install} className="bg-forest text-sage px-3.5 py-1.5 rounded-lg font-semibold text-xs hover:bg-forest-2 transition-colors">
            Install
          </button>
          <button onClick={dismiss} className="text-ink-soft text-xs font-medium">
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
