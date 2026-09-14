import React, { useEffect, useState } from 'react';
import { Download, Smartphone, CheckCircle2, HelpCircle, X } from 'lucide-react';
import Modal from './Modal';

// Global reference for beforeinstallprompt event
let deferredPrompt: any = null;

export function usePwaInstall() {
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    // Check if already in standalone mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    setIsInstalled(isStandalone);

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent) && !(window as any).MSStream;
    setIsIos(isIosDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      deferredPrompt = e;
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      deferredPrompt = null;
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = async (): Promise<boolean> => {
    if (!deferredPrompt) {
      return false;
    }
    try {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
        setIsInstallable(false);
        deferredPrompt = null;
        return true;
      }
    } catch (err) {
      console.error('PWA install prompt error:', err);
    }
    return false;
  };

  return { isInstallable, isInstalled, isIos, promptInstall };
}

/**
 * Compact Install App button for Header or Nav
 */
export function InstallAppButton({ className = '' }: { className?: string }) {
  const { isInstallable, isInstalled, isIos, promptInstall } = usePwaInstall();
  const [showIosGuide, setShowIosGuide] = useState(false);

  // Hide if already running inside installed standalone app
  if (isInstalled) {
    return null;
  }

  const handleClick = () => {
    if (isInstallable) {
      promptInstall();
    } else if (isIos) {
      setShowIosGuide(true);
    } else {
      setShowIosGuide(true);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50/85 hover:bg-indigo-100/90 border border-indigo-200/80 rounded-xl shadow-xs transition-all cursor-pointer select-none active:scale-95 ${className}`}
        title="Install StockFlow as a Mobile & Desktop App"
      >
        <Smartphone size={13} className="text-indigo-600 animate-pulse" />
        <span className="hidden sm:inline">Install App</span>
      </button>

      {/* Installation instructions modal for iOS or manual browsers */}
      {showIosGuide && (
        <Modal
          onClose={() => setShowIosGuide(false)}
          title="Install StockFlow on Your Device"
          size="md"
        >
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-3 p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-2xl">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-sm shrink-0">
              <Download size={20} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Install as Standalone App</h4>
              <p className="text-xs text-slate-600">Enjoy full-screen warehouse operations, offline shell caching, and instant startup.</p>
            </div>
          </div>

          <div className="space-y-2.5 text-xs text-slate-700">
            {isIos ? (
              <>
                <div className="flex items-start gap-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                  <span className="font-bold text-indigo-600">1.</span>
                  <p>In Safari, tap the <strong className="font-semibold text-slate-900">Share button</strong> (box with up arrow) in the bottom toolbar.</p>
                </div>
                <div className="flex items-start gap-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                  <span className="font-bold text-indigo-600">2.</span>
                  <p>Scroll down and tap <strong className="font-semibold text-slate-900">&quot;Add to Home Screen&quot;</strong>.</p>
                </div>
                <div className="flex items-start gap-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                  <span className="font-bold text-indigo-600">3.</span>
                  <p>Tap <strong className="font-semibold text-slate-900">&quot;Add&quot;</strong> in the top right. StockFlow will launch full-screen from your home screen!</p>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-start gap-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                  <span className="font-bold text-indigo-600">Option 1</span>
                  <p>In Chrome or Edge on Android or Desktop, click the <strong className="font-semibold text-slate-900">Install icon</strong> in the address bar or tap browser menu &gt; <strong className="font-semibold text-slate-900">&quot;Install App&quot;</strong>.</p>
                </div>
                <div className="flex items-start gap-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                  <span className="font-bold text-indigo-600">Option 2</span>
                  <p>Use the generated <strong className="font-semibold text-slate-900">StockFlow Android APK</strong> directly compiled from this Android Studio project.</p>
                </div>
              </>
            )}
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={() => setShowIosGuide(false)}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors cursor-pointer"
            >
              Got it
            </button>
          </div>
        </div>
      </Modal>
      )}
    </>
  );
}
