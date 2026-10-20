import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger, useGSAP);

// Condiciones compartidas para gsap.matchMedia(): toda animación exige `motion`.
export const MQ = {
  motion: '(prefers-reduced-motion: no-preference)',
  wide: '(min-width: 900px)',
  fine: '(hover: hover) and (pointer: fine)',
};

export { gsap, ScrollTrigger, useGSAP };
