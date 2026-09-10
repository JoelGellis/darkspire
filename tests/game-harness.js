// Loads every shipped script, isolated storage and clock; rendering is inert.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
function loadGame({memory = new Map(), seed = 42} = {}) {
  const noop = () => {};
  const el = () => ({classList:{add:noop,remove:noop,toggle:noop},style:{},appendChild:noop,
    remove:noop,prepend:noop,setAttribute:noop,addEventListener:noop,querySelector:()=>null,querySelectorAll:()=>[]});
  let random = seed >>> 0;
  const math = Object.create(Math);
  math.random = () => { random = (Math.imul(random,1664525)+1013904223)>>>0; return random/4294967296; };
  const storage = {get length(){return memory.size;},key:i=>[...memory.keys()][i]||null,
    getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,String(v)),removeItem:k=>memory.delete(k)};
  const sandbox = {console,Math:math,localStorage:storage,setTimeout:()=>0,clearTimeout:noop,
    requestAnimationFrame:()=>0,cancelAnimationFrame:noop,addEventListener:noop,confirm:()=>true,
    document:{getElementById:()=>null,querySelector:()=>null,querySelectorAll:()=>[],
      createElement:el,body:el(),head:el(),addEventListener:noop}};
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  const root = path.resolve(__dirname,'..');
  const scripts = [...fs.readFileSync(path.join(root,'index.html'),'utf8').matchAll(/<script src="([^"]+)"/g)].map(m=>m[1]);
  for (const script of scripts) vm.runInContext(fs.readFileSync(path.join(root,script),'utf8'),sandbox,{filename:script});
  sandbox.DS.Combat.sleep = async()=>{};
  return {DS:sandbox.DS,sandbox,memory,scripts};
}
module.exports = {loadGame};
