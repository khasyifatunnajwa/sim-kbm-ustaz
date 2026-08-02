import{s as M}from"./index-Bgt6Es4G.js";const $t=()=>{};var Se={};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const qe=function(e){const t=[];let n=0;for(let r=0;r<e.length;r++){let i=e.charCodeAt(r);i<128?t[n++]=i:i<2048?(t[n++]=i>>6|192,t[n++]=i&63|128):(i&64512)===55296&&r+1<e.length&&(e.charCodeAt(r+1)&64512)===56320?(i=65536+((i&1023)<<10)+(e.charCodeAt(++r)&1023),t[n++]=i>>18|240,t[n++]=i>>12&63|128,t[n++]=i>>6&63|128,t[n++]=i&63|128):(t[n++]=i>>12|224,t[n++]=i>>6&63|128,t[n++]=i&63|128)}return t},Lt=function(e){const t=[];let n=0,r=0;for(;n<e.length;){const i=e[n++];if(i<128)t[r++]=String.fromCharCode(i);else if(i>191&&i<224){const a=e[n++];t[r++]=String.fromCharCode((i&31)<<6|a&63)}else if(i>239&&i<365){const a=e[n++],o=e[n++],c=e[n++],d=((i&7)<<18|(a&63)<<12|(o&63)<<6|c&63)-65536;t[r++]=String.fromCharCode(55296+(d>>10)),t[r++]=String.fromCharCode(56320+(d&1023))}else{const a=e[n++],o=e[n++];t[r++]=String.fromCharCode((i&15)<<12|(a&63)<<6|o&63)}}return t.join("")},ze={byteToCharMap_:null,charToByteMap_:null,byteToCharMapWebSafe_:null,charToByteMapWebSafe_:null,ENCODED_VALS_BASE:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",get ENCODED_VALS(){return this.ENCODED_VALS_BASE+"+/="},get ENCODED_VALS_WEBSAFE(){return this.ENCODED_VALS_BASE+"-_."},HAS_NATIVE_SUPPORT:typeof atob=="function",encodeByteArray(e,t){if(!Array.isArray(e))throw Error("encodeByteArray takes an array as a parameter");this.init_();const n=t?this.byteToCharMapWebSafe_:this.byteToCharMap_,r=[];for(let i=0;i<e.length;i+=3){const a=e[i],o=i+1<e.length,c=o?e[i+1]:0,d=i+2<e.length,s=d?e[i+2]:0,H=a>>2,O=(a&3)<<4|c>>4;let j=(c&15)<<2|s>>6,V=s&63;d||(V=64,o||(j=64)),r.push(n[H],n[O],n[j],n[V])}return r.join("")},encodeString(e,t){return this.HAS_NATIVE_SUPPORT&&!t?btoa(e):this.encodeByteArray(qe(e),t)},decodeString(e,t){return this.HAS_NATIVE_SUPPORT&&!t?atob(e):Lt(this.decodeStringToByteArray(e,t))},decodeStringToByteArray(e,t){this.init_();const n=t?this.charToByteMapWebSafe_:this.charToByteMap_,r=[];for(let i=0;i<e.length;){const a=n[e.charAt(i++)],c=i<e.length?n[e.charAt(i)]:0;++i;const s=i<e.length?n[e.charAt(i)]:64;++i;const O=i<e.length?n[e.charAt(i)]:64;if(++i,a==null||c==null||s==null||O==null)throw new xt;const j=a<<2|c>>4;if(r.push(j),s!==64){const V=c<<4&240|s>>2;if(r.push(V),O!==64){const Ft=s<<6&192|O;r.push(Ft)}}}return r},init_(){if(!this.byteToCharMap_){this.byteToCharMap_={},this.charToByteMap_={},this.byteToCharMapWebSafe_={},this.charToByteMapWebSafe_={};for(let e=0;e<this.ENCODED_VALS.length;e++)this.byteToCharMap_[e]=this.ENCODED_VALS.charAt(e),this.charToByteMap_[this.byteToCharMap_[e]]=e,this.byteToCharMapWebSafe_[e]=this.ENCODED_VALS_WEBSAFE.charAt(e),this.charToByteMapWebSafe_[this.byteToCharMapWebSafe_[e]]=e,e>=this.ENCODED_VALS_BASE.length&&(this.charToByteMap_[this.ENCODED_VALS_WEBSAFE.charAt(e)]=e,this.charToByteMapWebSafe_[this.ENCODED_VALS.charAt(e)]=e)}}};class xt extends Error{constructor(){super(...arguments),this.name="DecodeBase64StringError"}}const Ht=function(e){const t=qe(e);return ze.encodeByteArray(t,!0)},Ge=function(e){return Ht(e).replace(/\./g,"")},jt=function(e){try{return ze.decodeString(e,!0)}catch(t){console.error("base64Decode failed: ",t)}return null};/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Vt(){if(typeof self<"u")return self;if(typeof window<"u")return window;if(typeof global<"u")return global;throw new Error("Unable to locate global object.")}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ut=()=>Vt().__FIREBASE_DEFAULTS__,Kt=()=>{if(typeof process>"u"||typeof Se>"u")return;const e=Se.__FIREBASE_DEFAULTS__;if(e)return JSON.parse(e)},Wt=()=>{if(typeof document>"u")return;let e;try{e=document.cookie.match(/__FIREBASE_DEFAULTS__=([^;]+)/)}catch{return}const t=e&&jt(e[1]);return t&&JSON.parse(t)},qt=()=>{try{return $t()||Ut()||Kt()||Wt()}catch(e){console.info(`Unable to get __FIREBASE_DEFAULTS__ due to: ${e}`);return}},Je=()=>{var e;return(e=qt())==null?void 0:e.config};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class zt{constructor(){this.reject=()=>{},this.resolve=()=>{},this.promise=new Promise((t,n)=>{this.resolve=t,this.reject=n})}wrapCallback(t){return(n,r)=>{n?this.reject(n):this.resolve(r),typeof t=="function"&&(this.promise.catch(()=>{}),t.length===1?t(n):t(n,r))}}}function Ye(){try{return typeof indexedDB=="object"}catch{return!1}}function Qe(){return new Promise((e,t)=>{try{let n=!0;const r="validate-browser-context-for-indexeddb-analytics-module",i=self.indexedDB.open(r);i.onsuccess=()=>{i.result.close(),n||self.indexedDB.deleteDatabase(r),e(!0)},i.onupgradeneeded=()=>{n=!1},i.onerror=()=>{var a;t(((a=i.error)==null?void 0:a.message)||"")}}catch(n){t(n)}})}function Gt(){return!(typeof navigator>"u"||!navigator.cookieEnabled)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Jt="FirebaseError";class C extends Error{constructor(t,n,r){super(n),this.code=t,this.customData=r,this.name=Jt,Object.setPrototypeOf(this,C.prototype),Error.captureStackTrace&&Error.captureStackTrace(this,q.prototype.create)}}class q{constructor(t,n,r){this.service=t,this.serviceName=n,this.errors=r}create(t,...n){const r=n[0]||{},i=`${this.service}/${t}`,a=this.errors[t],o=a?Yt(a,r):"Error",c=`${this.serviceName}: ${o} (${i}).`;return new C(i,c,r)}}function Yt(e,t){try{let n=0,r="";for(;n<e.length;){const i=e.indexOf("{$",n);if(i===-1){r+=e.substring(n);break}const a=e.indexOf("}",i+2);if(a===-1){r+=e.substring(n);break}const o=e.substring(i+2,a),c=t[o];r+=e.substring(n,i)+(c!=null?String(c):`<${o}?>`),n=a+1}return r}catch{return e}}function ie(e,t){if(e===t)return!0;const n=Object.keys(e),r=Object.keys(t);for(const i of n){if(!r.includes(i))return!1;const a=e[i],o=t[i];if(_e(a)&&_e(o)){if(!ie(a,o))return!1}else if(a!==o)return!1}for(const i of r)if(!n.includes(i))return!1;return!0}function _e(e){return e!==null&&typeof e=="object"}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function z(e){return e&&e._delegate?e._delegate:e}class y{constructor(t,n,r){this.name=t,this.instanceFactory=n,this.type=r,this.multipleInstances=!1,this.serviceProps={},this.instantiationMode="LAZY",this.onInstanceCreated=null}setInstantiationMode(t){return this.instantiationMode=t,this}setMultipleInstances(t){return this.multipleInstances=t,this}setServiceProps(t){return this.serviceProps=t,this}setInstanceCreatedCallback(t){return this.onInstanceCreated=t,this}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const I="[DEFAULT]";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Qt{constructor(t,n){this.name=t,this.container=n,this.component=null,this.instances=new Map,this.instancesDeferred=new Map,this.instancesOptions=new Map,this.onInitCallbacks=new Map}get(t){const n=this.normalizeInstanceIdentifier(t);if(!this.instancesDeferred.has(n)){const r=new zt;if(this.instancesDeferred.set(n,r),this.isInitialized(n)||this.shouldAutoInitialize())try{const i=this.getOrInitializeService({instanceIdentifier:n});i&&r.resolve(i)}catch{}}return this.instancesDeferred.get(n).promise}getImmediate(t){const n=this.normalizeInstanceIdentifier(t==null?void 0:t.identifier),r=(t==null?void 0:t.optional)??!1;if(this.isInitialized(n)||this.shouldAutoInitialize())try{return this.getOrInitializeService({instanceIdentifier:n})}catch(i){if(r)return null;throw i}else{if(r)return null;throw Error(`Service ${this.name} is not available`)}}getComponent(){return this.component}setComponent(t){if(t.name!==this.name)throw Error(`Mismatching Component ${t.name} for Provider ${this.name}.`);if(this.component)throw Error(`Component for ${this.name} has already been provided`);if(this.component=t,!!this.shouldAutoInitialize()){if(Zt(t))try{this.getOrInitializeService({instanceIdentifier:I})}catch{}for(const[n,r]of this.instancesDeferred.entries()){const i=this.normalizeInstanceIdentifier(n);try{const a=this.getOrInitializeService({instanceIdentifier:i});r.resolve(a)}catch{}}}}clearInstance(t=I){this.instancesDeferred.delete(t),this.instancesOptions.delete(t),this.instances.delete(t)}async delete(){const t=Array.from(this.instances.values());await Promise.all([...t.filter(n=>"INTERNAL"in n).map(n=>n.INTERNAL.delete()),...t.filter(n=>"_delete"in n).map(n=>n._delete())])}isComponentSet(){return this.component!=null}isInitialized(t=I){return this.instances.has(t)}getOptions(t=I){return this.instancesOptions.get(t)||{}}initialize(t={}){const{options:n={}}=t,r=this.normalizeInstanceIdentifier(t.instanceIdentifier);if(this.isInitialized(r))throw Error(`${this.name}(${r}) has already been initialized`);if(!this.isComponentSet())throw Error(`Component ${this.name} has not been registered yet`);const i=this.getOrInitializeService({instanceIdentifier:r,options:n});for(const[a,o]of this.instancesDeferred.entries()){const c=this.normalizeInstanceIdentifier(a);r===c&&o.resolve(i)}return i}onInit(t,n){const r=this.normalizeInstanceIdentifier(n),i=this.onInitCallbacks.get(r)??new Set;i.add(t),this.onInitCallbacks.set(r,i);const a=this.instances.get(r);return a&&t(a,r),()=>{i.delete(t)}}invokeOnInitCallbacks(t,n){const r=this.onInitCallbacks.get(n);if(r)for(const i of r)try{i(t,n)}catch{}}getOrInitializeService({instanceIdentifier:t,options:n={}}){let r=this.instances.get(t);if(!r&&this.component&&(r=this.component.instanceFactory(this.container,{instanceIdentifier:Xt(t),options:n}),this.instances.set(t,r),this.instancesOptions.set(t,n),this.invokeOnInitCallbacks(r,t),this.component.onInstanceCreated))try{this.component.onInstanceCreated(this.container,t,r)}catch{}return r||null}normalizeInstanceIdentifier(t=I){return this.component?this.component.multipleInstances?t:I:t}shouldAutoInitialize(){return!!this.component&&this.component.instantiationMode!=="EXPLICIT"}}function Xt(e){return e===I?void 0:e}function Zt(e){return e.instantiationMode==="EAGER"}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class en{constructor(t){this.name=t,this.providers=new Map}addComponent(t){const n=this.getProvider(t.name);if(n.isComponentSet())throw new Error(`Component ${t.name} has already been registered with ${this.name}`);n.setComponent(t)}addOrOverwriteComponent(t){this.getProvider(t.name).isComponentSet()&&this.providers.delete(t.name),this.addComponent(t)}getProvider(t){if(this.providers.has(t))return this.providers.get(t);const n=new Qt(t,this);return this.providers.set(t,n),n}getProviders(){return Array.from(this.providers.values())}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var f;(function(e){e[e.DEBUG=0]="DEBUG",e[e.VERBOSE=1]="VERBOSE",e[e.INFO=2]="INFO",e[e.WARN=3]="WARN",e[e.ERROR=4]="ERROR",e[e.SILENT=5]="SILENT"})(f||(f={}));const tn={debug:f.DEBUG,verbose:f.VERBOSE,info:f.INFO,warn:f.WARN,error:f.ERROR,silent:f.SILENT},nn=f.INFO,rn={[f.DEBUG]:"log",[f.VERBOSE]:"log",[f.INFO]:"info",[f.WARN]:"warn",[f.ERROR]:"error"},an=(e,t,...n)=>{if(t<e.logLevel)return;const r=new Date().toISOString(),i=rn[t];if(i)console[i](`[${r}]  ${e.name}:`,...n);else throw new Error(`Attempted to log a message with an invalid logType (value: ${t})`)};class on{constructor(t){this.name=t,this._logLevel=nn,this._logHandler=an,this._userLogHandler=null}get logLevel(){return this._logLevel}set logLevel(t){if(!(t in f))throw new TypeError(`Invalid value "${t}" assigned to \`logLevel\``);this._logLevel=t}setLogLevel(t){this._logLevel=typeof t=="string"?tn[t]:t}get logHandler(){return this._logHandler}set logHandler(t){if(typeof t!="function")throw new TypeError("Value assigned to `logHandler` must be a function");this._logHandler=t}get userLogHandler(){return this._userLogHandler}set userLogHandler(t){this._userLogHandler=t}debug(...t){this._userLogHandler&&this._userLogHandler(this,f.DEBUG,...t),this._logHandler(this,f.DEBUG,...t)}log(...t){this._userLogHandler&&this._userLogHandler(this,f.VERBOSE,...t),this._logHandler(this,f.VERBOSE,...t)}info(...t){this._userLogHandler&&this._userLogHandler(this,f.INFO,...t),this._logHandler(this,f.INFO,...t)}warn(...t){this._userLogHandler&&this._userLogHandler(this,f.WARN,...t),this._logHandler(this,f.WARN,...t)}error(...t){this._userLogHandler&&this._userLogHandler(this,f.ERROR,...t),this._logHandler(this,f.ERROR,...t)}}const sn=(e,t)=>t.some(n=>e instanceof n);let Te,ve;function cn(){return Te||(Te=[IDBDatabase,IDBObjectStore,IDBIndex,IDBCursor,IDBTransaction])}function dn(){return ve||(ve=[IDBCursor.prototype.advance,IDBCursor.prototype.continue,IDBCursor.prototype.continuePrimaryKey])}const Xe=new WeakMap,ae=new WeakMap,Ze=new WeakMap,Y=new WeakMap,le=new WeakMap;function un(e){const t=new Promise((n,r)=>{const i=()=>{e.removeEventListener("success",a),e.removeEventListener("error",o)},a=()=>{n(g(e.result)),i()},o=()=>{r(e.error),i()};e.addEventListener("success",a),e.addEventListener("error",o)});return t.then(n=>{n instanceof IDBCursor&&Xe.set(n,e)}).catch(()=>{}),le.set(t,e),t}function fn(e){if(ae.has(e))return;const t=new Promise((n,r)=>{const i=()=>{e.removeEventListener("complete",a),e.removeEventListener("error",o),e.removeEventListener("abort",o)},a=()=>{n(),i()},o=()=>{r(e.error||new DOMException("AbortError","AbortError")),i()};e.addEventListener("complete",a),e.addEventListener("error",o),e.addEventListener("abort",o)});ae.set(e,t)}let oe={get(e,t,n){if(e instanceof IDBTransaction){if(t==="done")return ae.get(e);if(t==="objectStoreNames")return e.objectStoreNames||Ze.get(e);if(t==="store")return n.objectStoreNames[1]?void 0:n.objectStore(n.objectStoreNames[0])}return g(e[t])},set(e,t,n){return e[t]=n,!0},has(e,t){return e instanceof IDBTransaction&&(t==="done"||t==="store")?!0:t in e}};function ln(e){oe=e(oe)}function hn(e){return e===IDBDatabase.prototype.transaction&&!("objectStoreNames"in IDBTransaction.prototype)?function(t,...n){const r=e.call(Q(this),t,...n);return Ze.set(r,t.sort?t.sort():[t]),g(r)}:dn().includes(e)?function(...t){return e.apply(Q(this),t),g(Xe.get(this))}:function(...t){return g(e.apply(Q(this),t))}}function pn(e){return typeof e=="function"?hn(e):(e instanceof IDBTransaction&&fn(e),sn(e,cn())?new Proxy(e,oe):e)}function g(e){if(e instanceof IDBRequest)return un(e);if(Y.has(e))return Y.get(e);const t=pn(e);return t!==e&&(Y.set(e,t),le.set(t,e)),t}const Q=e=>le.get(e);function G(e,t,{blocked:n,upgrade:r,blocking:i,terminated:a}={}){const o=indexedDB.open(e,t),c=g(o);return r&&o.addEventListener("upgradeneeded",d=>{r(g(o.result),d.oldVersion,d.newVersion,g(o.transaction),d)}),n&&o.addEventListener("blocked",d=>n(d.oldVersion,d.newVersion,d)),c.then(d=>{a&&d.addEventListener("close",()=>a()),i&&d.addEventListener("versionchange",s=>i(s.oldVersion,s.newVersion,s))}).catch(()=>{}),c}function U(e,{blocked:t}={}){const n=indexedDB.deleteDatabase(e);return t&&n.addEventListener("blocked",r=>t(r.oldVersion,r)),g(n).then(()=>{})}const gn=["get","getKey","getAll","getAllKeys","count"],bn=["put","add","delete","clear"],X=new Map;function Ae(e,t){if(!(e instanceof IDBDatabase&&!(t in e)&&typeof t=="string"))return;if(X.get(t))return X.get(t);const n=t.replace(/FromIndex$/,""),r=t!==n,i=bn.includes(n);if(!(n in(r?IDBIndex:IDBObjectStore).prototype)||!(i||gn.includes(n)))return;const a=async function(o,...c){const d=this.transaction(o,i?"readwrite":"readonly");let s=d.store;return r&&(s=s.index(c.shift())),(await Promise.all([s[n](...c),i&&d.done]))[0]};return X.set(t,a),a}ln(e=>({...e,get:(t,n,r)=>Ae(t,n)||e.get(t,n,r),has:(t,n)=>!!Ae(t,n)||e.has(t,n)}));/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class mn{constructor(t){this.container=t}getPlatformInfoString(){return this.container.getProviders().map(n=>{if(wn(n)){const r=n.getImmediate();return`${r.library}/${r.version}`}else return null}).filter(n=>n).join(" ")}}function wn(e){const t=e.getComponent();return(t==null?void 0:t.type)==="VERSION"}const se="@firebase/app",De="0.16.0";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const b=new on("@firebase/app"),yn="@firebase/app-compat",In="@firebase/analytics-compat",En="@firebase/analytics",Sn="@firebase/app-check-compat",_n="@firebase/app-check",Tn="@firebase/auth",vn="@firebase/auth-compat",An="@firebase/database",Dn="@firebase/data-connect",Cn="@firebase/database-compat",kn="@firebase/functions",Rn="@firebase/functions-compat",Nn="@firebase/installations",On="@firebase/installations-compat",Mn="@firebase/messaging",Bn="@firebase/messaging-compat",Pn="@firebase/performance",Fn="@firebase/performance-compat",$n="@firebase/remote-config",Ln="@firebase/remote-config-compat",xn="@firebase/storage",Hn="@firebase/storage-compat",jn="@firebase/firestore",Vn="@firebase/ai",Un="@firebase/firestore-compat",Kn="firebase";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ce="[DEFAULT]",Wn={[se]:"fire-core",[yn]:"fire-core-compat",[En]:"fire-analytics",[In]:"fire-analytics-compat",[_n]:"fire-app-check",[Sn]:"fire-app-check-compat",[Tn]:"fire-auth",[vn]:"fire-auth-compat",[An]:"fire-rtdb",[Dn]:"fire-data-connect",[Cn]:"fire-rtdb-compat",[kn]:"fire-fn",[Rn]:"fire-fn-compat",[Nn]:"fire-iid",[On]:"fire-iid-compat",[Mn]:"fire-fcm",[Bn]:"fire-fcm-compat",[Pn]:"fire-perf",[Fn]:"fire-perf-compat",[$n]:"fire-rc",[Ln]:"fire-rc-compat",[xn]:"fire-gcs",[Hn]:"fire-gcs-compat",[jn]:"fire-fst",[Un]:"fire-fst-compat",[Vn]:"fire-vertex","fire-js":"fire-js",[Kn]:"fire-js-all"};/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const K=new Map,qn=new Map,de=new Map;function Ce(e,t){try{e.container.addComponent(t)}catch(n){b.debug(`Component ${t.name} failed to register with FirebaseApp ${e.name}`,n)}}function S(e){const t=e.name;if(de.has(t))return b.debug(`There were multiple attempts to register component ${t}.`),!1;de.set(t,e);for(const n of K.values())Ce(n,e);for(const n of qn.values())Ce(n,e);return!0}function he(e,t){const n=e.container.getProvider("heartbeat").getImmediate({optional:!0});return n&&n.triggerHeartbeat(),e.container.getProvider(t)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const zn={"no-app":"No Firebase App '{$appName}' has been created - call initializeApp() first","bad-app-name":"Illegal App name: '{$appName}'","duplicate-app":"Firebase App named '{$appName}' already exists with different {$mismatchedParam}. Existing: '{$oldValue}'. New: '{$newValue}'.","app-deleted":"Firebase App named '{$appName}' already deleted","server-app-deleted":"Firebase Server App has been deleted","no-options":"Need to provide options, when not being deployed to hosting via source.","invalid-app-argument":"firebase.{$appName}() takes either no argument or a Firebase App instance.","invalid-log-argument":"First argument to `onLog` must be null or a function.","idb-open":"Error thrown when opening IndexedDB. Original error: {$originalErrorMessage}.","idb-get":"Error thrown when reading from IndexedDB. Original error: {$originalErrorMessage}.","idb-set":"Error thrown when writing to IndexedDB. Original error: {$originalErrorMessage}.","idb-delete":"Error thrown when deleting from IndexedDB. Original error: {$originalErrorMessage}.","finalization-registry-not-supported":"FirebaseServerApp deleteOnDeref field defined but the JS runtime does not support FinalizationRegistry.","invalid-server-app-environment":"FirebaseServerApp is not for use in browser environments."},p=new q("app","Firebase",zn);/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Gn{constructor(t,n,r){this._isDeleted=!1,this._options={...t},this._config={...n},this._name=n.name,this._automaticDataCollectionEnabled=n.automaticDataCollectionEnabled,this._container=r,this.container.addComponent(new y("app",()=>this,"PUBLIC"))}get automaticDataCollectionEnabled(){return this.checkDestroyed(),this._automaticDataCollectionEnabled}set automaticDataCollectionEnabled(t){this.checkDestroyed(),this._automaticDataCollectionEnabled=t}get name(){return this.checkDestroyed(),this._name}get options(){return this.checkDestroyed(),this._options}get config(){return this.checkDestroyed(),this._config}get container(){return this._container}get isDeleted(){return this._isDeleted}set isDeleted(t){this._isDeleted=t}checkDestroyed(){if(this.isDeleted)throw p.create("app-deleted",{appName:this._name})}}function et(e,t={}){let n=e;typeof t!="object"&&(t={name:t});const r={name:ce,automaticDataCollectionEnabled:!0,...t},i=r.name;if(typeof i!="string"||!i)throw p.create("bad-app-name",{appName:String(i)});if(n||(n=Je()),!n)throw p.create("no-options");const a=K.get(i);if(a)if(ie(n,a.options)){if(ie(r,a.config))return a;throw p.create("duplicate-app",{appName:i,mismatchedParam:"config",oldValue:JSON.stringify(a.config),newValue:JSON.stringify(r)})}else throw p.create("duplicate-app",{appName:i,mismatchedParam:"options",oldValue:JSON.stringify(a.options),newValue:JSON.stringify(n)});const o=new en(i);for(const d of de.values())o.addComponent(d);const c=new Gn(n,r,o);return K.set(i,c),c}function Jn(e=ce){const t=K.get(e);if(!t&&e===ce&&Je())return et();if(!t)throw p.create("no-app",{appName:e});return t}function w(e,t,n){let r=Wn[e]??e;n&&(r+=`-${n}`);const i=r.match(/\s|\//),a=t.match(/\s|\//);if(i||a){const o=[`Unable to register library "${r}" with version "${t}":`];i&&o.push(`library name "${r}" contains illegal characters (whitespace or "/")`),i&&a&&o.push("and"),a&&o.push(`version name "${t}" contains illegal characters (whitespace or "/")`),b.warn(o.join(" "));return}S(new y(`${r}-version`,()=>({library:r,version:t}),"VERSION"))}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Yn="firebase-heartbeat-database",Qn=1,P="firebase-heartbeat-store";let Z=null;function tt(){return Z||(Z=G(Yn,Qn,{upgrade:(e,t)=>{switch(t){case 0:try{e.createObjectStore(P)}catch(n){console.warn(n)}}}}).catch(e=>{throw p.create("idb-open",{originalErrorMessage:e.message})})),Z}async function Xn(e){try{const n=(await tt()).transaction(P),r=await n.objectStore(P).get(nt(e));return await n.done,r}catch(t){if(t instanceof C)b.warn(t.message);else{const n=p.create("idb-get",{originalErrorMessage:t==null?void 0:t.message});b.warn(n.message)}}}async function ke(e,t){try{const r=(await tt()).transaction(P,"readwrite");await r.objectStore(P).put(t,nt(e)),await r.done}catch(n){if(n instanceof C)b.warn(n.message);else{const r=p.create("idb-set",{originalErrorMessage:n==null?void 0:n.message});b.warn(r.message)}}}function nt(e){return`${e.name}!${e.options.appId}`}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Zn=1024,er=30;class tr{constructor(t){this.container=t,this._heartbeatsCache=null;const n=this.container.getProvider("app").getImmediate();this._storage=new rr(n),this._heartbeatsCachePromise=this._storage.read().then(r=>(this._heartbeatsCache=r,r))}async triggerHeartbeat(){var t,n;try{const i=this.container.getProvider("platform-logger").getImmediate().getPlatformInfoString(),a=Re();if(((t=this._heartbeatsCache)==null?void 0:t.heartbeats)==null&&(this._heartbeatsCache=await this._heartbeatsCachePromise,((n=this._heartbeatsCache)==null?void 0:n.heartbeats)==null)||this._heartbeatsCache.lastSentHeartbeatDate===a||this._heartbeatsCache.heartbeats.some(o=>o.date===a))return;if(this._heartbeatsCache.heartbeats.push({date:a,agent:i}),this._heartbeatsCache.heartbeats.length>er){const o=ir(this._heartbeatsCache.heartbeats);this._heartbeatsCache.heartbeats.splice(o,1)}return this._storage.overwrite(this._heartbeatsCache)}catch(r){b.warn(r)}}async getHeartbeatsHeader(){var t;try{if(this._heartbeatsCache===null&&await this._heartbeatsCachePromise,((t=this._heartbeatsCache)==null?void 0:t.heartbeats)==null||this._heartbeatsCache.heartbeats.length===0)return"";const n=Re(),{heartbeatsToSend:r,unsentEntries:i}=nr(this._heartbeatsCache.heartbeats),a=Ge(JSON.stringify({version:2,heartbeats:r}));return this._heartbeatsCache.lastSentHeartbeatDate=n,i.length>0?(this._heartbeatsCache.heartbeats=i,await this._storage.overwrite(this._heartbeatsCache)):(this._heartbeatsCache.heartbeats=[],this._storage.overwrite(this._heartbeatsCache)),a}catch(n){return b.warn(n),""}}}function Re(){return new Date().toISOString().substring(0,10)}function nr(e,t=Zn){const n=[];let r=e.slice();for(const i of e){const a=n.find(o=>o.agent===i.agent);if(a){if(a.dates.push(i.date),Ne(n)>t){a.dates.pop();break}}else if(n.push({agent:i.agent,dates:[i.date]}),Ne(n)>t){n.pop();break}r=r.slice(1)}return{heartbeatsToSend:n,unsentEntries:r}}class rr{constructor(t){this.app=t,this._canUseIndexedDBPromise=this.runIndexedDBEnvironmentCheck()}async runIndexedDBEnvironmentCheck(){return Ye()?Qe().then(()=>!0).catch(()=>!1):!1}async read(){if(await this._canUseIndexedDBPromise){const n=await Xn(this.app);return n!=null&&n.heartbeats?n:{heartbeats:[]}}else return{heartbeats:[]}}async overwrite(t){if(await this._canUseIndexedDBPromise){const r=await this.read();return ke(this.app,{lastSentHeartbeatDate:t.lastSentHeartbeatDate??r.lastSentHeartbeatDate,heartbeats:t.heartbeats})}else return}async add(t){if(await this._canUseIndexedDBPromise){const r=await this.read();return ke(this.app,{lastSentHeartbeatDate:t.lastSentHeartbeatDate??r.lastSentHeartbeatDate,heartbeats:[...r.heartbeats,...t.heartbeats]})}else return}}function Ne(e){return Ge(JSON.stringify({version:2,heartbeats:e})).length}function ir(e){if(e.length===0)return-1;let t=0,n=e[0].date;for(let r=1;r<e.length;r++)e[r].date<n&&(n=e[r].date,t=r);return t}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function ar(e){S(new y("platform-logger",t=>new mn(t),"PRIVATE")),S(new y("heartbeat",t=>new tr(t),"PRIVATE")),w(se,De,e),w(se,De,"esm2020"),w("fire-js","")}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */ar("");const rt="@firebase/installations",pe="0.6.23";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const it=1e4,at=`w:${pe}`,ot="FIS_v2",or="https://firebaseinstallations.googleapis.com/v1",sr=60*60*1e3,cr="installations",dr="Installations";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ur={"missing-app-config-values":'Missing App configuration value: "{$valueName}"',"not-registered":"Firebase Installation is not registered.","installation-not-found":"Firebase Installation not found.","request-failed":'{$requestName} request failed with error "{$serverCode} {$serverStatus}: {$serverMessage}"',"app-offline":"Could not process request. Application offline.","delete-pending-registration":"Can't delete installation while there is a pending registration request."},_=new q(cr,dr,ur);function st(e){return e instanceof C&&e.code.includes("request-failed")}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function ct({projectId:e}){return`${or}/projects/${e}/installations`}function dt(e){return{token:e.token,requestStatus:2,expiresIn:lr(e.expiresIn),creationTime:Date.now()}}async function ut(e,t){const r=(await t.json()).error;return _.create("request-failed",{requestName:e,serverCode:r.code,serverMessage:r.message,serverStatus:r.status})}function ft({apiKey:e}){return new Headers({"Content-Type":"application/json",Accept:"application/json","x-goog-api-key":e})}function fr(e,{refreshToken:t}){const n=ft(e);return n.append("Authorization",hr(t)),n}async function lt(e){const t=await e();return t.status>=500&&t.status<600?e():t}function lr(e){return Number(e.replace("s","000"))}function hr(e){return`${ot} ${e}`}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function pr({appConfig:e,heartbeatServiceProvider:t},{fid:n}){const r=ct(e),i=ft(e),a=t.getImmediate({optional:!0});if(a){const s=await a.getHeartbeatsHeader();s&&i.append("x-firebase-client",s)}const o={fid:n,authVersion:ot,appId:e.appId,sdkVersion:at},c={method:"POST",headers:i,body:JSON.stringify(o)},d=await lt(()=>fetch(r,c));if(d.ok){const s=await d.json();return{fid:s.fid||n,registrationStatus:2,refreshToken:s.refreshToken,authToken:dt(s.authToken)}}else throw await ut("Create Installation",d)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function ht(e){return new Promise(t=>{setTimeout(t,e)})}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function gr(e){return btoa(String.fromCharCode(...e)).replace(/\+/g,"-").replace(/\//g,"_")}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const br=/^[cdef][\w-]{21}$/,ue="";function mr(){try{const e=new Uint8Array(17);(self.crypto||self.msCrypto).getRandomValues(e),e[0]=112+e[0]%16;const n=wr(e);return br.test(n)?n:ue}catch{return ue}}function wr(e){return gr(e).substr(0,22)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function k(e){return`${e.appName}!${e.appId}`}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const v=new Map;function pt(e,t){const n=k(e);gt(n,t),Er(n,t)}function yr(e,t){bt();const n=k(e);let r=v.get(n);r||(r=new Set,v.set(n,r)),r.add(t)}function Ir(e,t){const n=k(e),r=v.get(n);r&&(r.delete(t),r.size===0&&v.delete(n),mt())}function gt(e,t){const n=v.get(e);if(n)for(const r of n)r(t)}function Er(e,t){const n=bt();n&&n.postMessage({key:e,fid:t}),mt()}let E=null;function bt(){return!E&&"BroadcastChannel"in self&&(E=new BroadcastChannel("[Firebase] FID Change"),E.onmessage=e=>{gt(e.data.key,e.data.fid)}),E}function mt(){v.size===0&&E&&(E.close(),E=null)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Sr="firebase-installations-database",_r=1,T="firebase-installations-store";let ee=null;function ge(){return ee||(ee=G(Sr,_r,{upgrade:(e,t)=>{switch(t){case 0:e.createObjectStore(T)}}})),ee}async function W(e,t){const n=k(e),i=(await ge()).transaction(T,"readwrite"),a=i.objectStore(T),o=await a.get(n);return await a.put(t,n),await i.done,(!o||o.fid!==t.fid)&&pt(e,t.fid),t}async function wt(e){const t=k(e),r=(await ge()).transaction(T,"readwrite");await r.objectStore(T).delete(t),await r.done}async function J(e,t){const n=k(e),i=(await ge()).transaction(T,"readwrite"),a=i.objectStore(T),o=await a.get(n),c=t(o);return c===void 0?await a.delete(n):await a.put(c,n),await i.done,c&&(!o||o.fid!==c.fid)&&pt(e,c.fid),c}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function be(e){let t;const n=await J(e.appConfig,r=>{const i=Tr(r),a=vr(e,i);return t=a.registrationPromise,a.installationEntry});return n.fid===ue?{installationEntry:await t}:{installationEntry:n,registrationPromise:t}}function Tr(e){const t=e||{fid:mr(),registrationStatus:0};return yt(t)}function vr(e,t){if(t.registrationStatus===0){if(!navigator.onLine){const i=Promise.reject(_.create("app-offline"));return{installationEntry:t,registrationPromise:i}}const n={fid:t.fid,registrationStatus:1,registrationTime:Date.now()},r=Ar(e,n);return{installationEntry:n,registrationPromise:r}}else return t.registrationStatus===1?{installationEntry:t,registrationPromise:Dr(e)}:{installationEntry:t}}async function Ar(e,t){try{const n=await pr(e,t);return W(e.appConfig,n)}catch(n){throw st(n)&&n.customData.serverCode===409?await wt(e.appConfig):await W(e.appConfig,{fid:t.fid,registrationStatus:0}),n}}async function Dr(e){let t=await Oe(e.appConfig);for(;t.registrationStatus===1;)await ht(100),t=await Oe(e.appConfig);if(t.registrationStatus===0){const{installationEntry:n,registrationPromise:r}=await be(e);return r||n}return t}function Oe(e){return J(e,t=>{if(!t)throw _.create("installation-not-found");return yt(t)})}function yt(e){return Cr(e)?{fid:e.fid,registrationStatus:0}:e}function Cr(e){return e.registrationStatus===1&&e.registrationTime+it<Date.now()}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function kr({appConfig:e,heartbeatServiceProvider:t},n){const r=Rr(e,n),i=fr(e,n),a=t.getImmediate({optional:!0});if(a){const s=await a.getHeartbeatsHeader();s&&i.append("x-firebase-client",s)}const o={installation:{sdkVersion:at,appId:e.appId}},c={method:"POST",headers:i,body:JSON.stringify(o)},d=await lt(()=>fetch(r,c));if(d.ok){const s=await d.json();return dt(s)}else throw await ut("Generate Auth Token",d)}function Rr(e,{fid:t}){return`${ct(e)}/${t}/authTokens:generate`}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function me(e,t=!1){let n;const r=await J(e.appConfig,a=>{if(!It(a))throw _.create("not-registered");const o=a.authToken;if(!t&&Mr(o))return a;if(o.requestStatus===1)return n=Nr(e,t),a;{if(!navigator.onLine)throw _.create("app-offline");const c=Pr(a);return n=Or(e,c),c}});return n?await n:r.authToken}async function Nr(e,t){let n=await Me(e.appConfig);for(;n.authToken.requestStatus===1;)await ht(100),n=await Me(e.appConfig);const r=n.authToken;return r.requestStatus===0?me(e,t):r}function Me(e){return J(e,t=>{if(!It(t))throw _.create("not-registered");const n=t.authToken;return Fr(n)?{...t,authToken:{requestStatus:0}}:t})}async function Or(e,t){try{const n=await kr(e,t),r={...t,authToken:n};return await W(e.appConfig,r),n}catch(n){if(st(n)&&(n.customData.serverCode===401||n.customData.serverCode===404))await wt(e.appConfig);else{const r={...t,authToken:{requestStatus:0}};await W(e.appConfig,r)}throw n}}function It(e){return e!==void 0&&e.registrationStatus===2}function Mr(e){return e.requestStatus===2&&!Br(e)}function Br(e){const t=Date.now();return t<e.creationTime||e.creationTime+e.expiresIn<t+sr}function Pr(e){const t={requestStatus:1,requestTime:Date.now()};return{...e,authToken:t}}function Fr(e){return e.requestStatus===1&&e.requestTime+it<Date.now()}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function $r(e){const t=e,{installationEntry:n,registrationPromise:r}=await be(t);return r?r.catch(console.error):me(t).catch(console.error),n.fid}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Lr(e,t=!1){const n=e;return await xr(n),(await me(n,t)).token}async function xr(e){const{registrationPromise:t}=await be(e);t&&await t}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Hr(e,t){const{appConfig:n}=e;return yr(n,t),()=>{Ir(n,t)}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function jr(e){if(!e||!e.options)throw te("App Configuration");if(!e.name)throw te("App Name");const t=["projectId","apiKey","appId"];for(const n of t)if(!e.options[n])throw te(n);return{appName:e.name,projectId:e.options.projectId,apiKey:e.options.apiKey,appId:e.options.appId}}function te(e){return _.create("missing-app-config-values",{valueName:e})}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Et="installations",Vr="installations-internal",Ur=e=>{const t=e.getProvider("app").getImmediate(),n=jr(t),r=he(t,"heartbeat");return{app:t,appConfig:n,heartbeatServiceProvider:r,_delete:()=>Promise.resolve()}},Kr=e=>{const t=e.getProvider("app").getImmediate(),n=he(t,Et).getImmediate();return{getId:()=>$r(n),getToken:i=>Lr(n,i)}};function Wr(){S(new y(Et,Ur,"PUBLIC")),S(new y(Vr,Kr,"PRIVATE"))}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */Wr();w(rt,pe);w(rt,pe,"esm2020");/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const qr="/firebase-messaging-sw.js",zr="/firebase-cloud-messaging-push-scope",St="BDOU99-h67HcA6JeFXHbSNMu7e2yNNu3RzoMj8TM4W88jITfq7ZmPvIM1Iv-4_l2LxQcYwhqby2xGpWwzjfAnG4",Gr="https://fcmregistrations.googleapis.com/v1",_t="google.c.a.c_id",Jr="google.c.a.c_l",Yr="google.c.a.ts",Qr="google.c.a.e",Be=1e4;var Pe;(function(e){e[e.DATA_MESSAGE=1]="DATA_MESSAGE",e[e.DISPLAY_NOTIFICATION=3]="DISPLAY_NOTIFICATION"})(Pe||(Pe={}));/**
 * @license
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License. You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the License
 * is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
 * or implied. See the License for the specific language governing permissions and limitations under
 * the License.
 */var A;(function(e){e.PUSH_RECEIVED="push-received",e.NOTIFICATION_CLICKED="notification-clicked",e.FID_REGISTERED="fid-registered"})(A||(A={}));/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function l(e){const t=new Uint8Array(e);return btoa(String.fromCharCode(...t)).replace(/=/g,"").replace(/\+/g,"-").replace(/\//g,"_")}function Tt(e){const t="=".repeat((4-e.length%4)%4),n=(e+t).replace(/\-/g,"+").replace(/_/g,"/"),r=atob(n),i=new Uint8Array(r.length);for(let a=0;a<r.length;++a)i[a]=r.charCodeAt(a);return i}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ne="fcm_token_details_db",Xr=5,Fe="fcm_token_object_Store";async function Zr(e){if("databases"in indexedDB&&!(await indexedDB.databases()).map(a=>a.name).includes(ne))return null;let t=null;return(await G(ne,Xr,{upgrade:async(r,i,a,o)=>{if(i<2||!r.objectStoreNames.contains(Fe))return;const c=o.objectStore(Fe),d=await c.index("fcmSenderId").get(e);if(await c.clear(),!!d){if(i===2){const s=d;if(!s.auth||!s.p256dh||!s.endpoint)return;t={token:s.fcmToken,createTime:s.createTime??Date.now(),subscriptionOptions:{auth:s.auth,p256dh:s.p256dh,endpoint:s.endpoint,swScope:s.swScope,vapidKey:typeof s.vapidKey=="string"?s.vapidKey:l(s.vapidKey)}}}else if(i===3){const s=d;t={token:s.fcmToken,createTime:s.createTime,subscriptionOptions:{auth:l(s.auth),p256dh:l(s.p256dh),endpoint:s.endpoint,swScope:s.swScope,vapidKey:l(s.vapidKey)}}}else if(i===4){const s=d;t={token:s.fcmToken,createTime:s.createTime,subscriptionOptions:{auth:l(s.auth),p256dh:l(s.p256dh),endpoint:s.endpoint,swScope:s.swScope,vapidKey:l(s.vapidKey)}}}}}})).close(),await U(ne),await U("fcm_vapid_details_db"),await U("undefined"),ei(t)?t:null}function ei(e){if(!e||!e.subscriptionOptions)return!1;const{subscriptionOptions:t}=e;return typeof e.createTime=="number"&&e.createTime>0&&typeof e.token=="string"&&e.token.length>0&&typeof t.auth=="string"&&t.auth.length>0&&typeof t.p256dh=="string"&&t.p256dh.length>0&&typeof t.endpoint=="string"&&t.endpoint.length>0&&typeof t.swScope=="string"&&t.swScope.length>0&&typeof t.vapidKey=="string"&&t.vapidKey.length>0}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ti={"missing-app-config-values":'Missing App configuration value: "{$valueName}"',"only-available-in-window":"This method is available in a Window context.","only-available-in-sw":"This method is available in a service worker context.","permission-default":"The notification permission was not granted and dismissed instead.","permission-blocked":"The notification permission was not granted and blocked instead.","unsupported-browser":"This browser doesn't support the API's required to use the Firebase SDK.","indexed-db-unsupported":"This browser doesn't support indexedDb.open() (ex. Safari iFrame, Firefox Private Browsing, etc)","failed-service-worker-registration":"We are unable to register the default service worker. {$browserErrorMessage}","token-subscribe-failed":"A problem occurred while subscribing the user to FCM: {$errorInfo}","token-subscribe-no-token":"FCM returned no token when subscribing the user to push.","fid-registration-failed":"A problem occurred while creating an FCM registration via FID: {$errorInfo}","fid-unregister-failed":"A problem occurred while unregistering the FCM registration via FID: {$errorInfo}","fid-registration-idb-schema-unavailable":"Unable to read or persist FID registration metadata because the messaging IndexedDB schema is unavailable (for example, the database could not be upgraded to the latest version).","token-unsubscribe-failed":"A problem occurred while unsubscribing the user from FCM: {$errorInfo}","token-update-failed":"A problem occurred while updating the user from FCM: {$errorInfo}","token-update-no-token":"FCM returned no token when updating the user to push.","use-sw-after-get-token":"The useServiceWorker() method may only be called once and must be called before calling getToken() to ensure your service worker is used.","invalid-sw-registration":"The input to useServiceWorker() must be a ServiceWorkerRegistration.","invalid-bg-handler":"The input to setBackgroundMessageHandler() must be a function.","invalid-vapid-key":"The public VAPID key must be a string.","use-vapid-key-after-get-token":"The usePublicVapidKey() method may only be called once and must be called before calling getToken() to ensure your VAPID key is used.","invalid-on-registered-handler":"No onRegistered callback handler was provided or registered. Implement onRegistered() before register()."},u=new q("messaging","Messaging",ti);/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const $e="firebase-messaging-database",Le=2,m="firebase-messaging-store",h="firebase-messaging-fid-registration-store",ni={openDB:G,deleteDB:U};let xe=ni,B=null;function ri(e,t,n){switch(t){case 0:if(e.createObjectStore(m),n===1)break;case 1:n===2&&e.createObjectStore(h)}}function He(e){return{upgrade:(t,n)=>{ri(t,n,e)},blocked:()=>{},blocking:(t,n,r)=>{var i;B=null,(i=r.target)==null||i.close()},terminated:()=>{B=null}}}function R(){return B||(B=xe.openDB($e,Le,He(2)).catch(()=>xe.openDB($e,Le-1,He(1)))),B}function vt(e,t){return e.objectStoreNames.contains(t)}function we(e){if(!vt(e,h))throw u.create("fid-registration-idb-schema-unavailable")}async function At(e){const t=N(e),r=await(await R()).transaction(m).objectStore(m).get(t);if(r)return r;{const i=await Zr(e.appConfig.senderId);if(i)return await ye(e,i),i}}async function ye(e,t){const n=N(e),r=await R(),i=[m],a=vt(r,h);a&&i.push(h);const o=r.transaction(i,"readwrite");return await o.objectStore(m).put(t,n),a&&await o.objectStore(h).delete(n),await o.done,t}async function ii(e){const t=N(e),r=(await R()).transaction(m,"readwrite");await r.objectStore(m).delete(t),await r.done}async function Ie(e){const t=N(e),n=await R();return we(n),await n.transaction(h).objectStore(h).get(t)}async function ai(e,t){const n=N(e),r=await R();we(r);const i=r.transaction([m,h],"readwrite");return await i.objectStore(h).put(t,n),await i.objectStore(m).delete(n),await i.done,t}async function oi(e){const t=N(e),n=await R();we(n);const r=n.transaction(h,"readwrite");await r.objectStore(h).delete(t),await r.done}function N({appConfig:e}){return e.appId}const je="@firebase/messaging",fe="0.13.1";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const si=3,ci=1e3;async function di(e,t){const n=await $(e),r=Ee(t,e.appConfig.appName,!1),i={method:"POST",headers:n,body:JSON.stringify(r)};let a;try{a=await(await fetch(F(e.appConfig),i)).json()}catch(o){throw u.create("token-subscribe-failed",{errorInfo:o==null?void 0:o.toString()})}if(a.error){const o=a.error.message;throw u.create("token-subscribe-failed",{errorInfo:o})}if(!a.token)throw u.create("token-subscribe-no-token");return a.token}async function ui(e,t){var d;const n=await $(e),r=Ee(t,e.appConfig.appName,!0),i={method:"POST",headers:n,body:JSON.stringify(r)};let a;try{a=await gi(()=>fetch(F(e.appConfig),i),si,ci)}catch(s){throw u.create("fid-registration-failed",{errorInfo:s==null?void 0:s.toString()})}if(a.ok)return{responseFid:await li(a)};let o;try{o=await a.json()}catch{throw u.create("fid-registration-failed",{errorInfo:a.statusText})}const c=((d=o.error)==null?void 0:d.message)??a.statusText;throw u.create("fid-registration-failed",{errorInfo:c})}async function fi(e,t){var a;const r={method:"DELETE",headers:await $(e)};let i;try{i=await fetch(`${F(e.appConfig)}/${t}`,r)}catch(o){throw u.create("fid-unregister-failed",{errorInfo:o==null?void 0:o.toString()})}if(!i.ok)try{throw((a=(await i.json()).error)==null?void 0:a.message)??i.statusText}catch(o){throw u.create("fid-unregister-failed",{errorInfo:typeof o=="string"&&o||i.statusText||(o==null?void 0:o.toString())})}}async function li(e){const t=await e.text();if(!t.trim())throw u.create("fid-registration-failed",{errorInfo:"CreateRegistration succeeded but response body is empty"});let n;try{n=JSON.parse(t)}catch{throw u.create("fid-registration-failed",{errorInfo:"CreateRegistration succeeded but response body is not valid JSON"})}const r=n.name;if(typeof r!="string"||r.length===0)throw u.create("fid-registration-failed",{errorInfo:"CreateRegistration succeeded but response did not include a non-empty name"});return hi(r)}const Ve="/registrations/";function hi(e){const t=e.indexOf(Ve);if(t!==-1){const n=e.slice(t+Ve.length);if(n.length>0)return n}throw u.create("fid-registration-failed",{errorInfo:"CreateRegistration succeeded but response name is not a valid registration resource name"})}async function pi(e,t){const n=await $(e),r=Ee(t.subscriptionOptions,e.appConfig.appName,!1),i={method:"PATCH",headers:n,body:JSON.stringify(r)};let a;try{a=await(await fetch(`${F(e.appConfig)}/${t.token}`,i)).json()}catch(o){throw u.create("token-update-failed",{errorInfo:o==null?void 0:o.toString()})}if(a.error){const o=a.error.message;throw u.create("token-update-failed",{errorInfo:o})}if(!a.token)throw u.create("token-update-no-token");return a.token}async function Dt(e,t){const r={method:"DELETE",headers:await $(e)};try{const a=await(await fetch(`${F(e.appConfig)}/${t}`,r)).json();if(a.error){const o=a.error.message;throw u.create("token-unsubscribe-failed",{errorInfo:o})}}catch(i){throw u.create("token-unsubscribe-failed",{errorInfo:i==null?void 0:i.toString()})}}async function gi(e,t,n){let r;for(let i=0;i<t;i++)try{return await e()}catch(a){if(r=a,i<t-1){const o=n*Math.pow(2,i);await new Promise(c=>setTimeout(c,o))}}throw r}function F({projectId:e}){return`${Gr}/projects/${e}/registrations`}async function $({appConfig:e,installations:t}){const n=await t.getToken();return new Headers({"Content-Type":"application/json",Accept:"application/json","x-goog-api-key":e.apiKey,"x-goog-firebase-installations-auth":`FIS ${n}`})}function bi(e,t){var n,r;try{if(/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(e))return new URL(e).host}catch{}try{if(typeof self<"u"&&((n=self.location)!=null&&n.href))return new URL(e,self.location.origin).host}catch{}return typeof self<"u"&&((r=self.location)!=null&&r.host)?self.location.host:t}function Ee({p256dh:e,auth:t,endpoint:n,vapidKey:r,swScope:i},a,o){const c={web:{origin:bi(i,a),endpoint:n,auth:t,p256dh:e}};return o&&(c.fcm_sdk_version=fe),r!==St&&(c.web.applicationPubKey=r),c}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const mi=7*24*60*60*1e3;async function wi(e){const t=await _i(e.swRegistration,e.vapidKey),n={vapidKey:e.vapidKey,swScope:e.swRegistration.scope,endpoint:t.endpoint,auth:l(t.getKey("auth")),p256dh:l(t.getKey("p256dh"))},r=await At(e.firebaseDependencies);if(r){if(Ti(r.subscriptionOptions,n))return Date.now()>=r.createTime+mi?Si(e,{token:r.token,createTime:Date.now(),subscriptionOptions:n}):r.token;try{await Dt(e.firebaseDependencies,r.token)}catch(i){console.warn(i)}return Ue(e.firebaseDependencies,n)}else return Ue(e.firebaseDependencies,n)}async function yi(e,t){await Dt(e.firebaseDependencies,t.token),await ii(e.firebaseDependencies),await Ct(e.firebaseDependencies)}async function Ii(e){const t=await Ie(e.firebaseDependencies).catch(()=>{}),n=t==null?void 0:t.fid;n&&await fi(e.firebaseDependencies,n),await Ct(e.firebaseDependencies),n&&Ai(e,n)}async function Ei(e){const t=await At(e.firebaseDependencies);t?await yi(e,t):await Ii(e);const n=await e.swRegistration.pushManager.getSubscription();return n?n.unsubscribe():!0}async function Si(e,t){try{const n=await pi(e.firebaseDependencies,t),r={...t,token:n,createTime:Date.now()};return await ye(e.firebaseDependencies,r),n}catch(n){throw n}}async function Ue(e,t){const r={token:await di(e,t),createTime:Date.now(),subscriptionOptions:t};return await ye(e,r),r.token}async function _i(e,t){const n=await e.pushManager.getSubscription();return n||e.pushManager.subscribe({userVisibleOnly:!0,applicationServerKey:Tt(t)})}function Ti(e,t){const n=t.vapidKey===e.vapidKey,r=t.endpoint===e.endpoint,i=t.auth===e.auth,a=t.p256dh===e.p256dh;return n&&r&&i&&a}async function Ct(e){try{await oi(e)}catch{}}function vi(e,t){const n=e.onRegisteredHandler;n&&(typeof n=="function"?n(t):n.next(t))}function Ai(e,t){const n=e.onUnregisteredHandler;n&&(typeof n=="function"?n(t):n.next(t))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function kt(e){try{e.swRegistration=await navigator.serviceWorker.register(qr,{scope:zr}),e.swRegistration.update().catch(()=>{}),await Di(e.swRegistration)}catch(t){throw u.create("failed-service-worker-registration",{browserErrorMessage:t==null?void 0:t.message})}}async function Di(e){return new Promise((t,n)=>{const r=setTimeout(()=>n(new Error(`Service worker not registered after ${Be} ms`)),Be),i=e.installing||e.waiting;e.active?(clearTimeout(r),t()):i?i.onstatechange=a=>{var o;((o=a.target)==null?void 0:o.state)==="activated"&&(i.onstatechange=null,clearTimeout(r),t())}:(clearTimeout(r),n(new Error("No incoming service worker found.")))})}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Rt(e,t){if(!t&&!e.swRegistration&&await kt(e),!(!t&&e.swRegistration)){if(!(t instanceof ServiceWorkerRegistration))throw u.create("invalid-sw-registration");e.swRegistration=t}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Nt(e,t){t?e.vapidKey=t:e.vapidKey||(e.vapidKey=St)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ke=3;async function Ci(e,t){const n=await ki(e.swRegistration,e.vapidKey),r={vapidKey:e.vapidKey,swScope:e.swRegistration.scope,endpoint:n.endpoint,auth:l(n.getKey("auth")),p256dh:l(n.getKey("p256dh"))},i=e.firebaseDependencies.installations;for(let a=0;a<Ke;a++){const{responseFid:o}=await ui(e.firebaseDependencies,r);if(o===t)return;a<Ke-1&&await i.getToken(!0)}throw u.create("fid-registration-failed",{errorInfo:"CreateRegistration response FID does not match Firebase Installation ID"})}async function ki(e,t){const n=await e.pushManager.getSubscription();return n||e.pushManager.subscribe({userVisibleOnly:!0,applicationServerKey:Tt(t)})}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ri=7*24*60*60*1e3;async function Ot(e,t){if(!navigator)throw u.create("only-available-in-window");if(Notification.permission==="default"&&await Notification.requestPermission(),Notification.permission!=="granted")throw u.create("permission-blocked");if(!e.onRegisteredHandler)throw u.create("invalid-on-registered-handler");await Nt(e,t==null?void 0:t.vapidKey),await Rt(e,t==null?void 0:t.serviceWorkerRegistration);const n=e._registerNotifyChain.catch(()=>{});return e._registerNotifyChain=n.then(async()=>{const r=await e.firebaseDependencies.installations.getId(),i=await Ie(e.firebaseDependencies),a=Date.now();if((!i||i.fid!==r||a>=i.lastRegisterTime+Ri)&&(await Ci(e,r),await ai(e.firebaseDependencies,{fid:r,lastRegisterTime:a,vapidKey:e.vapidKey})),!e.onRegisteredHandler)throw u.create("invalid-on-registered-handler");vi(e,r)}),e._registerNotifyChain}/**
 * @license
 * Copyright 2026 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Ni(e,t){return Hr(t,()=>{(async()=>!e.onRegisteredHandler||!await Ie(e.firebaseDependencies)||await Ot(e).catch(()=>{}))()})}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function We(e){const t={from:e.from,collapseKey:e.collapse_key,messageId:e.fcmMessageId};return Oi(t,e),Mi(t,e),Bi(t,e),t}function Oi(e,t){if(!t.notification)return;e.notification={};const n=t.notification.title;n&&(e.notification.title=n);const r=t.notification.body;r&&(e.notification.body=r);const i=t.notification.image;i&&(e.notification.image=i);const a=t.notification.icon;a&&(e.notification.icon=a)}function Mi(e,t){t.data&&(e.data=t.data)}function Bi(e,t){var i,a,o,c;if(!t.fcmOptions&&!((i=t.notification)!=null&&i.click_action))return;e.fcmOptions={};const n=((a=t.fcmOptions)==null?void 0:a.link)??((o=t.notification)==null?void 0:o.click_action);n&&(e.fcmOptions.link=n);const r=(c=t.fcmOptions)==null?void 0:c.analytics_label;r&&(e.fcmOptions.analyticsLabel=r)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Pi(e){return typeof e=="object"&&!!e&&_t in e}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Fi(e){if(!e||!e.options)throw re("App Configuration Object");if(!e.name)throw re("App Name");const t=["projectId","apiKey","appId","messagingSenderId"],{options:n}=e;for(const r of t)if(!n[r])throw re(r);return{appName:e.name,projectId:n.projectId,apiKey:n.apiKey,appId:n.appId,senderId:n.messagingSenderId}}function re(e){return u.create("missing-app-config-values",{valueName:e})}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class $i{constructor(t,n,r){this.deliveryMetricsExportedToBigQueryEnabled=!1,this.onBackgroundMessageHandler=null,this.onMessageHandler=null,this.onRegisteredHandler=null,this.onUnregisteredHandler=null,this._registerNotifyChain=Promise.resolve(),this._fidChangeUnsubscribe=null,this.logEvents=[],this.logQueue={state:"stopped"};const i=Fi(t);this.firebaseDependencies={app:t,appConfig:i,installations:n,analyticsProvider:r}}_delete(){return this._fidChangeUnsubscribe&&(this._fidChangeUnsubscribe(),this._fidChangeUnsubscribe=null),this.logQueue.state==="scheduled"&&clearTimeout(this.logQueue.timerId),this.logQueue={state:"stopped"},Promise.resolve()}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Mt(e,t){if(!navigator)throw u.create("only-available-in-window");if(Notification.permission==="default"&&await Notification.requestPermission(),Notification.permission!=="granted")throw u.create("permission-blocked");return await Nt(e,t==null?void 0:t.vapidKey),await Rt(e,t==null?void 0:t.serviceWorkerRegistration),wi(e)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Li(e,t,n){const r=xi(t);(await e.firebaseDependencies.analyticsProvider.get()).logEvent(r,{message_id:n[_t],message_name:n[Jr],message_time:n[Yr],message_device_time:Math.floor(Date.now()/1e3)})}function xi(e){switch(e){case A.NOTIFICATION_CLICKED:return"notification_open";case A.PUSH_RECEIVED:return"notification_foreground";default:throw new Error}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Hi(e,t){const n=t.data;if(!n.isFirebaseMessaging)return;if(e.onMessageHandler&&n.messageType===A.PUSH_RECEIVED&&(typeof e.onMessageHandler=="function"?e.onMessageHandler(We(n)):e.onMessageHandler.next(We(n))),e.onRegisteredHandler&&n.messageType===A.FID_REGISTERED){const i=n.fid;typeof e.onRegisteredHandler=="function"?e.onRegisteredHandler(i):e.onRegisteredHandler.next(i)}const r=n.data;Pi(r)&&r[Qr]==="1"&&await Li(e,n.messageType,r)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ji=e=>{const t=new $i(e.getProvider("app").getImmediate(),e.getProvider("installations-internal").getImmediate(),e.getProvider("analytics-internal"));return navigator.serviceWorker.addEventListener("message",n=>Hi(t,n)),t._fidChangeUnsubscribe=Ni(t,e.getProvider("installations").getImmediate()),t},Vi=e=>{const t=e.getProvider("messaging").getImmediate();return{getToken:r=>Mt(t,r),register:r=>Ot(t,r)}};function Ui(){S(new y("messaging",ji,"PUBLIC")),S(new y("messaging-internal",Vi,"PRIVATE")),w(je,fe),w(je,fe,"esm2020")}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Bt(){try{await Qe()}catch{return!1}return typeof window<"u"&&Ye()&&Gt()&&"serviceWorker"in navigator&&"PushManager"in window&&"Notification"in window&&"fetch"in window&&ServiceWorkerRegistration.prototype.hasOwnProperty("showNotification")&&PushSubscription.prototype.hasOwnProperty("getKey")}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Ki(e){if(!navigator)throw u.create("only-available-in-window");return e.swRegistration||await kt(e),Ei(e)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Wi(e,t){if(!navigator)throw u.create("only-available-in-window");return e.onMessageHandler=t,()=>{e.onMessageHandler=null}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function L(e=Jn()){return Bt().then(t=>{if(!t)throw u.create("unsupported-browser")},t=>{throw u.create("indexed-db-unsupported")}),he(z(e),"messaging").getImmediate()}async function qi(e,t){return e=z(e),Mt(e,t)}function Pt(e){return e=z(e),Ki(e)}function zi(e,t){return e=z(e),Wi(e,t)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */Ui();var Gi="firebase",Ji="12.17.0";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */w(Gi,Ji,"app");const Yi={apiKey:"AIzaSyBt1iF6NuW3Dtqtm8MIn25mUPAUX91veWU",authDomain:"sim-kbm-ustaz.firebaseapp.com",projectId:"sim-kbm-ustaz",storageBucket:"sim-kbm-ustaz.firebasestorage.app",messagingSenderId:"653918611888",appId:"1:653918611888:web:36e297003173f7366b8e75",measurementId:"G-5ETBXL66B6"},Qi="BLWkLz0vH3Y8nGpQr5tQ2sF7xQ1zP9mK4dR6sT8uW0aE3bC5yD7fG9hJ2kL4mN6pQ8s",x=et(Yi);let D=null;try{D=L(x)}catch{D=null}async function Xi(){try{return typeof window>"u"||!("Notification"in window)||!("serviceWorker"in navigator)?!1:await Bt()}catch{return!1}}function na(){return typeof Notification>"u"?"denied":Notification.permission}async function ra(){if(typeof Notification>"u")return"denied";try{return await Notification.requestPermission()}catch{return"denied"}}async function Zi(){if(!("serviceWorker"in navigator))return null;try{return await navigator.serviceWorker.register("/firebase-messaging-sw.js",{scope:"/firebase-cloud-messaging-push-scope/"})}catch{return null}}async function ia(e,t="web"){if(!await Xi()||Notification.permission!=="granted"||!D)return null;const n=await Zi(),r=L(x);let i;try{i=await qi(r,{vapidKey:Qi,...n?{serviceWorkerRegistration:n}:{}})}catch{return null}return i?(await ea(e,i,t),i):null}async function ea(e,t,n){try{const{data:r}=await M.from("device_tokens").select("id, token").eq("user_id",e).eq("token",t).maybeSingle();if(r){await M.from("device_tokens").update({platform:n}).eq("id",r.id);return}await M.from("device_tokens").insert({user_id:e,token:t,platform:n})}catch{}}async function aa(e){try{await M.from("device_tokens").delete().eq("token",e),D&&await Pt(L(x))}catch{}}async function oa(e){try{await M.from("device_tokens").delete().eq("user_id",e),D&&await Pt(L(x))}catch{}}function sa(e){if(!D)return()=>{};try{return zi(L(x),e)}catch{return()=>{}}}function ca(e,t,n="/"){if(!(typeof Notification>"u"||Notification.permission!=="granted"))try{const r=new Notification(e,{body:t,icon:"/icon/192x192.png",badge:"/icon/192x192.png",tag:"simkbm-push",data:{url:n}});r.onclick=()=>{window.focus(),r.close()}}catch{}}export{ia as getAndSaveToken,na as getPermission,Xi as isPushSupported,sa as onForegroundMessage,ra as requestPermission,oa as revokeAllUserTokens,aa as revokeToken,ca as showLocalNotification};
