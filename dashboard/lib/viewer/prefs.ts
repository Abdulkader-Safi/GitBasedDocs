// Reader preferences live on <html> as data attributes, so CSS can apply
// them with no React render, and in localStorage so they survive reloads.
// This script runs in <head> before first paint (app/layout.tsx): the page
// never flashes at the default width and then jumps.
export const PREF_KEYS = {
  pageWidth: "gbd:page-width",
  outline: "gbd:outline",
} as const

export const PREFS_SCRIPT = `try{var d=document.documentElement,s=localStorage;d.dataset.pageWidth=s.getItem("${PREF_KEYS.pageWidth}")||"narrow";d.dataset.outline=s.getItem("${PREF_KEYS.outline}")||"shown"}catch(e){}`
