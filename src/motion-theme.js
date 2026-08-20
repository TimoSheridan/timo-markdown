export const MOTION_STYLES = `/* Four 21px rows and three 16px gaps produce the live 132px ticker. */
.marquee-wrapper {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  overflow-x: hidden;
  overflow-y: scroll;
  max-width: 100%;
}

.marquee {
  white-space: nowrap;
  overflow: hidden;
  display: inline-flex;
}

.forward-scroll {
  -webkit-animation: marquee 120s linear infinite;
  animation: marquee 120s linear infinite;
}

.reverse-scroll {
  -webkit-animation: marqueereverse 120s linear infinite;
  animation: marqueereverse 120s linear infinite;
}

.vertical-scroll-container {
  margin: 0;
  padding: 0;
  font-size: inherit;
  -webkit-animation: scrollUp 10s linear infinite;
  animation: scrollUp 10s linear infinite;
}

.vertical-scroll-container > li {
  padding: 14px 0;
  line-height: 1em;
  list-style: none;
  text-align: center;
}

.marquee-wrapper .text {
  display: inline-flex;
}

.ticker-copy,
.ticker-phrase {
  display: inline-flex;
  align-items: baseline;
}

.marquee-wrapper .marquee + .marquee {
  margin-top: 16px;
}

.box {
  overflow: hidden;
  height: 0.73em;
}

.inline-flex-baseline {
  display: inline-flex;
  align-items: baseline;
}

@keyframes scrollUp {
  from {
    -webkit-transform: translateY(0);
    transform: translateY(0);
  }
  to {
    -webkit-transform: translateY(-100%);
    transform: translateY(-100%);
  }
}

@keyframes marqueereverse {
  0% {
    -webkit-transform: translate3d(-50%, 0, 0);
    transform: translate3d(-50%, 0, 0);
  }
  100% {
    -webkit-transform: translate3d(0, 0, 0);
    transform: translate3d(0, 0, 0);
  }
}

@keyframes marquee {
  0% {
    -webkit-transform: translate3d(0, 0, 0);
    transform: translate3d(0, 0, 0);
  }
  100% {
    -webkit-transform: translate3d(-50%, 0, 0);
    transform: translate3d(-50%, 0, 0);
  }
}
`;
