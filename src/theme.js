export const BASE_STYLES = `:root {
  --blue: #3366cc;
  --off-white: #f5f5f5;
}

body {
  margin: 0;
  background-color: var(--off-white);
  text-size-adjust: 100%;
  -webkit-text-size-adjust: 100%;
}

ul {
  margin-top: 4px;
}

ul > li {
  margin-top: 8px;
}

li:first-of-type {
  margin-top: 12px;
}

a,
a:visited {
  color: var(--blue);
  text-decoration-line: none;
}

.playfair-black {
  font-family: 'Playfair Display', serif;
}

.timo-image {
  max-height: 100px;
  position: absolute;
  top: 0;
}

.content {
  margin: 160px 5vw 10vh 10vw;
}

.content-header {
  margin-top: 16px;
}

.footer {
  margin-bottom: 24px;
}

@media (max-width: 258px) {
  .break-contact-information {
    word-break: break-all;
  }
}

::-webkit-scrollbar {
  display: none;
}

* {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
`;
