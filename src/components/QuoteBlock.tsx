"use client";

import React from 'react';

const QuoteBlock = () => {
  return (
    <div className="quote-card">
      <p className="quote-text">
        &quot;Ce n&apos;est pas d&apos;un tête-à-tête ni d&apos;un corps à corps, c&apos;est d&apos;un cœur à cœur que nous avons besoin.&quot;
      </p>
      <p className="quote-author">— Pierre Teilhard de Chardin</p>

      <style jsx>{`
        .quote-card {
          background: white;
          padding: 1.5rem;
          border-radius: 12px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          margin: 0 1rem 1rem 1rem;
        }
        .quote-text {
          font-style: italic;
          font-size: 1rem;
          line-height: 1.6;
          color: var(--foreground);
          margin-bottom: 0.75rem;
        }
        .quote-author {
          font-size: 0.875rem;
          color: var(--primary);
          font-weight: 500;
        }
      `}</style>
    </div>
  );
};

export default QuoteBlock;
