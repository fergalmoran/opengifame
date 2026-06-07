'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

interface PasteUploadContextValue {
  /** The most recently pasted image, awaiting consumption by the upload page. */
  pastedFile: File | null;
  /** Clears the pasted image once the upload page has taken it. */
  clearPastedFile: () => void;
}

const PasteUploadContext = createContext<PasteUploadContextValue | null>(null);

export function usePasteUpload() {
  const ctx = useContext(PasteUploadContext);
  if (!ctx) {
    throw new Error('usePasteUpload must be used within a PasteUploadProvider');
  }
  return ctx;
}

/** Pull the first image out of a paste, with a sensible filename. */
function extractImageFile(clipboardData: DataTransfer | null): File | null {
  if (!clipboardData) return null;

  const imageItem = Array.from(clipboardData.items).find(
    (item) => item.kind === 'file' && item.type.startsWith('image/'),
  );
  const file = imageItem?.getAsFile();
  if (!file) return null;

  // Clipboard files are frequently unnamed or generically named ("image.png"),
  // so give them a unique, extension-correct name for the upload.
  if (file.name && file.name.includes('.')) return file;
  const extension = file.type.split('/')[1] || 'png';
  return new File([file], `pasted-${Date.now()}.${extension}`, {
    type: file.type,
  });
}

export function PasteUploadProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { status } = useSession();
  const [pastedFile, setPastedFile] = useState<File | null>(null);

  const clearPastedFile = useCallback(() => setPastedFile(null), []);

  useEffect(() => {
    // Only hijack image pastes for signed-in users; everyone else pastes as normal.
    if (status !== 'authenticated') return;

    const handlePaste = (event: ClipboardEvent) => {
      const file = extractImageFile(event.clipboardData);
      if (!file) return;

      event.preventDefault();
      setPastedFile(file);
      if (pathname !== '/upload') {
        router.push('/upload');
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [status, pathname, router]);

  return (
    <PasteUploadContext.Provider value={{ pastedFile, clearPastedFile }}>
      {children}
    </PasteUploadContext.Provider>
  );
}
