"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "@/app/button-tooltips.css";

type Tip = { text: string; target: HTMLElement; host: HTMLElement };
const selector = 'button, [role="button"], input[type="button"], input[type="submit"], input[type="reset"], a.primary-button, a.overview-primary, .upload-browse, label.add-pages-button';

function buttonAt(target: EventTarget | null): HTMLElement | null {
  return target instanceof Element ? target.closest<HTMLElement>(selector) : null;
}
function labelFor(element: HTMLElement): string {
  if (element.hasAttribute("data-tooltip-disabled")) return "";
  const labelledBy = element.getAttribute("aria-labelledby")?.split(/\s+/).map(id => document.getElementById(id)?.textContent ?? "").join(" ");
  const label = element.getAttribute("data-tooltip") || element.getAttribute("title") || element.getAttribute("aria-label") || labelledBy || (element instanceof HTMLInputElement ? element.value : element.textContent);
  return (label ?? "").replace(/\s+/g, " ").trim().slice(0, 240);
}

/** One delegated listener supports existing buttons, dynamic grids and modal dialogs. */
export default function ButtonTooltips() {
  const id = useId();
  const [tip, setTip] = useState<Tip | null>(null);
  const tooltip = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active: HTMLElement | null = null;
    let savedTitle: string | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let leaveTimer: ReturnType<typeof setTimeout> | undefined;
    let clickTimer: ReturnType<typeof setTimeout> | undefined;
    let visible = false;
    let touchStart: { x: number; y: number } | null = null;
    let suppressClick = false;
    function hide() {
      clearTimeout(timer); clearTimeout(leaveTimer);
      if (active) {
        const descriptions = active.getAttribute("aria-describedby")?.split(/\s+/).filter(value => value && value !== id);
        if (descriptions?.length) active.setAttribute("aria-describedby", descriptions.join(" "));
        else active.removeAttribute("aria-describedby");
        if (savedTitle !== null && !active.hasAttribute("title")) active.setAttribute("title", savedTitle);
      }
      active = null; savedTitle = null; visible = false; touchStart = null;
      setTip(null);
    }
    function activate(element: HTMLElement, delay: number, touch = false) {
      if (element === active) return;
      hide();
      const text = labelFor(element);
      if (!text) return;
      active = element;
      savedTitle = element.getAttribute("title");
      if (savedTitle !== null) element.removeAttribute("title");
      const show = () => {
        if (active !== element || !element.isConnected) return;
        visible = true;
        if (touch) suppressClick = true;
        const describedBy = new Set((element.getAttribute("aria-describedby") ?? "").split(/\s+/).filter(Boolean));
        describedBy.add(id); element.setAttribute("aria-describedby", [...describedBy].join(" "));
        setTip({ text, target: element, host: element.closest<HTMLDialogElement>("dialog[open]") ?? document.body });
      };
      if (delay) timer = setTimeout(show, delay); else show();
    }
    function over(event: PointerEvent) {
      if (event.pointerType === "touch") return;
      if (event.target instanceof Element && event.target.closest(".button-tooltip")) { clearTimeout(leaveTimer); return; }
      const element = buttonAt(event.target);
      if (element) activate(element, 350);
    }
    function out(event: PointerEvent) {
      if (event.pointerType === "touch") return;
      if (active?.contains(event.relatedTarget as Node)) return;
      if (event.relatedTarget instanceof Element && event.relatedTarget.closest(".button-tooltip")) { clearTimeout(leaveTimer); return; }
      if (active || visible) leaveTimer = setTimeout(hide, 120);
    }
    function focus(event: FocusEvent) { const element = buttonAt(event.target); if (element) activate(element, 0); }
    function blur(event: FocusEvent) { if (active && !active.contains(event.relatedTarget as Node)) hide(); }
    function down(event: PointerEvent) {
      hide(); suppressClick = false; clearTimeout(clickTimer);
      if (event.pointerType !== "touch") return;
      const element = buttonAt(event.target);
      if (element) { activate(element, 550, true); touchStart = {x:event.clientX,y:event.clientY}; }
    }
    function move(event: PointerEvent) {
      if (touchStart && (Math.abs(event.clientX-touchStart.x)>12 || Math.abs(event.clientY-touchStart.y)>12)) hide();
    }
    function up(event: PointerEvent) {
      if (event.pointerType !== "touch") return;
      touchStart = null;
      if (!visible) hide();
      if (suppressClick) clickTimer = setTimeout(() => { suppressClick = false; }, 800);
    }
    function click(event: MouseEvent) {
      if (suppressClick) { event.preventDefault(); event.stopImmediatePropagation(); suppressClick = false; return; }
      hide();
    }
    function context(event: Event) { if (suppressClick) event.preventDefault(); }
    function key(event: KeyboardEvent) { if (event.key === "Escape") hide(); }
    document.addEventListener("pointerover", over, true);
    document.addEventListener("pointerout", out, true);
    document.addEventListener("focusin", focus, true);
    document.addEventListener("focusout", blur, true);
    document.addEventListener("pointerdown", down, true);
    document.addEventListener("pointermove", move, true);
    document.addEventListener("pointerup", up, true);
    document.addEventListener("pointercancel", hide, true);
    document.addEventListener("click", click, true);
    document.addEventListener("contextmenu", context, true);
    document.addEventListener("keydown", key, true);
    document.addEventListener("scroll", hide, true);
    window.addEventListener("resize", hide);
    return () => {
      hide(); clearTimeout(clickTimer);
      document.removeEventListener("pointerover", over, true);
      document.removeEventListener("pointerout", out, true);
      document.removeEventListener("focusin", focus, true);
      document.removeEventListener("focusout", blur, true);
      document.removeEventListener("pointerdown", down, true);
      document.removeEventListener("pointermove", move, true);
      document.removeEventListener("pointerup", up, true);
      document.removeEventListener("pointercancel", hide, true);
      document.removeEventListener("click", click, true);
      document.removeEventListener("contextmenu", context, true);
      document.removeEventListener("keydown", key, true);
      document.removeEventListener("scroll", hide, true);
      window.removeEventListener("resize", hide);
    };
  }, [id]);

  useLayoutEffect(() => {
    if (!tip || !tooltip.current) return;
    const node = tooltip.current;
    const anchor = tip.target.getBoundingClientRect();
    const host = tip.host === document.body ? {left:0,top:0,right:window.innerWidth,bottom:window.innerHeight} : tip.host.getBoundingClientRect();
    node.style.maxWidth = `${Math.max(80,Math.min(280,host.right-host.left-24))}px`;
    const bounds = node.getBoundingClientRect();
    const center = anchor.left + anchor.width/2;
    const left = Math.max(host.left+10,Math.min(center-bounds.width/2,host.right-bounds.width-10));
    const above = anchor.top-bounds.height-10 >= host.top+8;
    const top = above ? anchor.top-bounds.height-10 : Math.min(anchor.bottom+10,host.bottom-bounds.height-8);
    node.style.left = `${left}px`; node.style.top = `${Math.max(host.top+8,top)}px`;
    node.style.setProperty("--tooltip-arrow",`${Math.max(10,Math.min(center-left,bounds.width-10))}px`);
    node.dataset.placement = above ? "above" : "below";
  }, [tip]);

  return tip ? createPortal(<div ref={tooltip} id={id} role="tooltip" className="button-tooltip">{tip.text}</div>, tip.host) : null;
}
