"use client";

import * as React from "react";

const LinksInfo = () => {
  return (
    <div>
      <a
        href="https://github.com/cleanupDev/nn_visualization"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          textDecoration: "none",
          color: "inherit",
        }}
        aria-label="GitHub Repository Link"
      >
        <svg
          width="7.7%"
          height="7.7%"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M12 0C5.373 0 0 5.373 0 12c0 5.303 3.438 9.8 8.205 11.385.6.111.82-.261.82-.577v-2.255c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.838 1.237 1.838 1.237 1.07 1.834 2.807 1.304 3.492.997.108-.775.418-1.304.762-1.603-2.665-.305-5.467-1.332-5.467-5.93 0-1.31.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.3 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.046.138 3.003.404 2.291-1.552 3.297-1.23 3.297-1.230.653 1.652.242 2.873.118 3.176.768.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.92.43.371.814 1.102.814 2.222v3.293c0 .319.217.694.825.577C20.565 21.797 24 17.301 24 12c0-6.627-5.373-12-12-12z"
            fill="#24292e" // Adjusted fill color for visibility
          />
        </svg>
      </a>
    </div>
  );
};

export default LinksInfo;
