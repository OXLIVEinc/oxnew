import { useEffect ,useState} from "react";

const TYPEWRITER_PHRASES = [
  'Built to Empower Events.',
  'Where Every Moment Counts.',
  'Your Events, Amplified.',
];



export const TypewriterText: React.FC = () => {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [displayText, setDisplayText] = useState('');

  useEffect(() => {
    const phrase = TYPEWRITER_PHRASES[phraseIndex];
    const speed = deleting ? 30 : 60;
    const pauseEnd = 2000;

    const timer = setTimeout(() => {
      if (!deleting && charIndex < phrase.length) {
        setDisplayText(phrase.slice(0, charIndex + 1));
        setCharIndex(charIndex + 1);
      } else if (!deleting && charIndex === phrase.length) {
        setTimeout(() => setDeleting(true), pauseEnd);
      } else if (deleting && charIndex > 0) {
        setDisplayText(phrase.slice(0, charIndex - 1));
        setCharIndex(charIndex - 1);
      } else if (deleting && charIndex === 0) {
        setDeleting(false);
        setPhraseIndex((phraseIndex + 1) % TYPEWRITER_PHRASES.length);
      }
    }, speed);

    return () => clearTimeout(timer);
  }, [charIndex, deleting, phraseIndex]);

  return (
    <span>
      {displayText}
      <span className="inline-block w-[2px] h-[1em] bg-foreground ml-0.5 animate-pulse align-middle" />
    </span>
  );
};