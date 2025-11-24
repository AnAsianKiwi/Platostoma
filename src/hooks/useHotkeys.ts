import { useEffect } from 'react';
import { useDataStore } from '../store/useDataStore';
import { useUIStore } from '../store/useUIStore';

export const useHotkeys = () => {
  const { settings } = useDataStore();
  const { startManualAdd, isSettingsOpen, activeMediaId } = useUIStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Safety Check: Don't trigger shortcuts while user is typing in a form
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
        return;
      }

      // 2. Parse the Configured Shortcut (e.g., "Ctrl+Alt+n")
      if (!settings.keybinds.addMedia) return;
      
      const shortcutParts = settings.keybinds.addMedia.toLowerCase().split('+').map(k => k.trim());
      const mainKey = shortcutParts[shortcutParts.length - 1]; // The last part is the actual key (e.g. "n")

      // 3. Check Modifiers
      const wantsCtrl = shortcutParts.includes('ctrl');
      const wantsAlt = shortcutParts.includes('alt');
      const wantsShift = shortcutParts.includes('shift');
      const wantsMeta = shortcutParts.includes('meta') || shortcutParts.includes('cmd'); // Mac Command key

      // 4. Check if Event Matches Config
      const isMatch = 
        e.key.toLowerCase() === mainKey &&
        e.ctrlKey === wantsCtrl &&
        e.altKey === wantsAlt &&
        e.shiftKey === wantsShift &&
        e.metaKey === wantsMeta;

      if (isMatch) {
        e.preventDefault(); // Stop browser from doing its default action
        
        // Only trigger if no other modal is currently blocking the view
        if (!isSettingsOpen && !activeMediaId) {
            startManualAdd();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [settings.keybinds.addMedia, startManualAdd, isSettingsOpen, activeMediaId]);
};