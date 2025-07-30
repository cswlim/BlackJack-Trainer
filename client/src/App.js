/* In src/index.css */

/* --- Custom Scrollbar Styles --- */

/* For Firefox */
html {
  scrollbar-width: thin;
  scrollbar-color: #4b5563 #111827; 
}

/* For WebKit browsers (Chrome, Safari, Edge) */
::-webkit-scrollbar {
  width: 14px;
}

::-webkit-scrollbar-track {
  background: #111827;
}

::-webkit-scrollbar-thumb {
  background-color: #4b5563;
  border-radius: 10px;
  border: 3px solid #111827;
}

::-webkit-scrollbar-thumb:hover {
  background-color: #6b7280;
}
