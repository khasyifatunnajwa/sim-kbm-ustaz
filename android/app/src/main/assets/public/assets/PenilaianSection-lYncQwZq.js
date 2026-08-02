import{c as n,r as b,j as a,F as o,B as m}from"./index-Bgt6Es4G.js";import{A as d}from"./award-BaF_Qa90.js";import{B as h}from"./book-marked-CN61wDA1.js";/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const p=n("Mic",[["path",{d:"M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z",key:"131961"}],["path",{d:"M19 10v2a7 7 0 0 1-14 0v-2",key:"1vc78b"}],["line",{x1:"12",x2:"12",y1:"19",y2:"22",key:"x3vr5v"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const k=n("ScrollText",[["path",{d:"M8 21h12a2 2 0 0 0 2-2v-2H10v2a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v3h4",key:"13a6an"}],["path",{d:"M19 17V5a2 2 0 0 0-2-2H4",key:"zz82l3"}],["path",{d:"M15 8h-5",key:"1khuty"}],["path",{d:"M15 12h-5",key:"r7krc0"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const y=n("Smile",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M8 14s1.5 2 4 2 4-2 4-2",key:"1y1vjs"}],["line",{x1:"9",x2:"9.01",y1:"9",y2:"9",key:"yxxnd0"}],["line",{x1:"15",x2:"15.01",y1:"9",y2:"9",key:"1p4y9e"}]]);function N({showToast:u}){const[s,x]=b.useState("harian"),l=[{id:"harian",label:"Nilai Harian",icon:d},{id:"uts",label:"UTS",icon:o},{id:"uas",label:"UAS",icon:o},{id:"lisan",label:"Ujian Lisan",icon:p},{id:"hafalan",label:"Hafalan",icon:h},{id:"baca-kitab",label:"Baca Kitab",icon:m},{id:"sikap",label:"Sikap",icon:y},{id:"rapor",label:"Rapor",icon:k}];return a.jsxs("div",{className:"space-y-3",children:[a.jsxs("div",{className:"mb-3",children:[a.jsx("h2",{className:"text-base font-bold text-slate-800 dark:text-slate-100",children:"Penilaian"}),a.jsx("p",{className:"text-xs text-slate-500 dark:text-slate-400",children:"Kelola berbagai jenis penilaian dan rapor"})]}),a.jsx("div",{className:"grid grid-cols-2 md:grid-cols-4 gap-1.5",children:l.map(e=>{const t=e.icon;return a.jsxs("button",{onClick:()=>x(e.id),className:`flex items-center gap-1.5 p-2.5 rounded-xl text-xs font-semibold transition-all border ${s===e.id?"bg-violet-600 text-white border-violet-600":"bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700"}`,children:[a.jsx(t,{className:"w-3.5 h-3.5"}),a.jsx("span",{className:"truncate",children:e.label})]},e.id)})}),a.jsx("div",{className:"card p-6 text-center",children:(()=>{var r,c;const e=((r=l.find(i=>i.id===s))==null?void 0:r.icon)??d,t=((c=l.find(i=>i.id===s))==null?void 0:c.label)??"";return a.jsxs(a.Fragment,{children:[a.jsx(e,{className:"w-10 h-10 text-slate-300 mx-auto mb-2"}),a.jsx("p",{className:"text-sm font-semibold text-slate-700 dark:text-slate-200",children:t}),a.jsxs("p",{className:"text-xs text-slate-400 mt-1",children:["Kelola data ",t.toLowerCase()," dari menu utama ustaz"]})]})})()})]})}export{N as default};
