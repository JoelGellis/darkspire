// Deterministic, allowlisted static release; does not publish or delete anything.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process');
const root=path.resolve(__dirname,'..');
function runtimeBytes(file) {
  const bytes=fs.readFileSync(path.join(root,file));
  return /\.(html|js|css|svg)$/.test(file)?Buffer.from(bytes.toString('utf8').replace(/^\uFEFF/,'').replace(/\r\n?/g,'\n')):bytes;
}
const html=runtimeBytes('index.html').toString('utf8');
const files=new Set(['index.html']);
for(const match of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
  const file=match[1];if(!/^https?:/.test(file))files.add(file);
}
function walk(dir) {
  for(const entry of fs.readdirSync(path.join(root,dir),{withFileTypes:true})) {
    const file=dir+'/'+entry.name;if(entry.isDirectory())walk(file);else files.add(file);
  }
}
walk('assets/exported');
// Remove only after the expedition owner completes integrated browser/regression validation.
if(files.has('js/expedition.js'))throw Error('Unvalidated expedition.js is explicitly excluded from this incremental release.');
for(const file of files) {
  if(!/^(index\.html|(?:js|data)\/[\w-]+\.js|css\/[\w-]+\.css|assets\/exported\/[^.][\w/.-]+)$/.test(file)||file.includes('..'))throw Error('Disallowed release path '+file);
  if(!fs.existsSync(path.join(root,file)))throw Error('Missing runtime file '+file);
  if(file.endsWith('.js')) {
    const result=cp.spawnSync(process.execPath,['--check',path.join(root,file)],{encoding:'utf8'});
    if(result.status!==0)throw Error(result.stderr);
  }
}
const suites=fs.readdirSync(path.join(root,'tests')).filter(f=>f.endsWith('.js')&&!/(fixture|browser|harness)/.test(f)).sort();
for(const suite of suites) {
  const result=cp.spawnSync(process.execPath,[path.join(root,'tests',suite)],{cwd:root,encoding:'utf8'});
  process.stdout.write(result.stdout);if(result.status!==0)throw Error(suite+' failed\n'+result.stderr);
}
const sorted=[...files].sort();
const entries=sorted.map(file=>({file,sha256:crypto.createHash('sha256').update(runtimeBytes(file)).digest('hex')}));
const build=crypto.createHash('sha256').update(JSON.stringify(entries)).digest('hex').slice(0,16);
const output=path.join(root,'.release',build);
fs.mkdirSync(output,{recursive:true});
for(const file of sorted) {
  const target=path.join(output,file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,runtimeBytes(file));
}
const version='incremental-'+build;
const injection='<script>window.DS=window.DS||{};window.DS.VERSION='+JSON.stringify(version)+';</script>';
const label='<div style="position:fixed;bottom:4px;right:4px;z-index:9998;color:#c9b58b;background:#191714;padding:4px;font:11px sans-serif">Incremental demo · '+build+' · Round 1 in progress</div>';
fs.writeFileSync(path.join(output,'index.html'),html.replace('<!-- Data -->',injection+'\n<!-- Data -->').replace('</body>',label+'\n</body>'));
const commit=cp.spawnSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).stdout.trim();
const manifest={schema:1,version,build,sourceCommit:commit,status:'Incremental; full 100-improvement round is incomplete',
  tests:suites,sourceFiles:entries,artifactFiles:sorted.map(file=>({file,sha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(output,file))).digest('hex')}))};
fs.writeFileSync(path.join(output,'release-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
fs.writeFileSync(path.join(output,'.nojekyll'),'');
const expected=new Set([...sorted,'release-manifest.json','.nojekyll']);
function inspectOutput(dir,relative='') {
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})) {
    const rel=relative?relative+'/'+entry.name:entry.name;
    if(entry.isDirectory())inspectOutput(path.join(dir,entry.name),rel);
    else if(!expected.has(rel))throw Error('Stale or unapproved file in release artifact: '+rel);
  }
}
inspectOutput(output);
console.log(JSON.stringify({version,output,files:sorted.length,sourceCommit:commit}));
if(process.env.GITHUB_OUTPUT)fs.appendFileSync(process.env.GITHUB_OUTPUT,'path='+output+'\n');
