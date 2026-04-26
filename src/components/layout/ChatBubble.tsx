import { MessageCircle } from 'lucide-react';

export function ChatBubble() {
  return (
    <a
      href="https://wa.me/2348000000000"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-white py-1.5 pl-3 pr-1.5 shadow-card-hover transition-shadow hover:shadow-lg"
      aria-label="Need help? Chat with us on WhatsApp"
    >
      <span className="hidden font-sans text-xs font-medium text-charcoal sm:inline">
        Need Help? Chat with us
      </span>
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#25D366] text-white">
        <MessageCircle size={20} aria-hidden />
      </span>
    </a>
  );
}
