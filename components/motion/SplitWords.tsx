import { Fragment, type CSSProperties } from 'react';

/**
 * A line that arrives word by word, each word turning up out of the page
 * (`animate-word-in` in app/globals.css). The parent needs perspective for
 * the turn to read as 3D.
 *
 * The words themselves are the only copy of the text, so a heading still
 * reads (and copies, and indexes) as one sentence; spaces stay real spaces
 * between the word spans. Works on the server, so the words are in the
 * first paint.
 */
export function SplitWords({
  text,
  start = 0,
  offset = 0,
  wordClassName = '',
}: {
  text: string;
  /** Milliseconds before the first word moves. */
  start?: number;
  /** Where this line sits in a longer stagger, counted in words. */
  offset?: number;
  /** Classes for each word's inner span (e.g. a gold sheen). */
  wordClassName?: string;
}) {
  const words = text.split(' ');
  return (
    <>
      {words.map((word, i) => (
        <Fragment key={`${word}-${i}`}>
          <span
            className="animate-word-in"
            style={
              { '--i': offset + i, '--start': `${start}ms` } as CSSProperties
            }
          >
            {/* A sheen per word, offset so it travels along the phrase. */}
            <span
              className={wordClassName}
              style={
                wordClassName
                  ? { animationDelay: `${(offset + i) * -0.35}s` }
                  : undefined
              }
            >
              {word}
            </span>
          </span>
          {i < words.length - 1 ? ' ' : null}
        </Fragment>
      ))}
    </>
  );
}
